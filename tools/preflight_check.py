#!/usr/bin/env python3
"""Pre-launch check for the deployed WeebTrax stack.

Verifies the three hosts the live site depends on, exactly as a browser
would reach them, plus that the frontend is actually wired to production
rather than to a developer's laptop.

Run before flipping the Cloudflare Pages build output to `production/`:

    python3 tools/preflight_check.py

Exits non-zero if any check fails, so it can gate a deploy.
"""

import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

SITE = "https://weebtrax.com"
API = "https://api.weebtrax.com"
MEDIA = "https://media.weebtrax.com"

# Cloudflare's bot protection rejects the default Python user agent with a
# 403, which would make every media file look broken. Send a browser one.
UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/140.0 Safari/537.36"
)

REPO = Path(__file__).resolve().parent.parent

results = []


def check(name, ok, detail=""):
    results.append((name, ok, detail))
    print(f"  {'PASS' if ok else 'FAIL'}  {name}" + (f" — {detail}" if detail else ""))
    return ok


def request(url, method="GET", origin=None, headers=None):
    h = {"User-Agent": UA}
    if origin:
        h["Origin"] = origin
    if headers:
        h.update(headers)
    req = urllib.request.Request(url, method=method, headers=h)
    return urllib.request.urlopen(req, timeout=30)


def section(title):
    print(f"\n{title}")
    print("-" * len(title))


def main():
    print("WeebTrax pre-launch check")
    print("=" * 40)

    # ---- hosts reachable -------------------------------------------------
    section("Hosts")
    for label, url in [("countdown/site", SITE), ("api", f"{API}/health")]:
        try:
            r = request(url)
            check(f"{label} reachable", r.status == 200, f"HTTP {r.status}")
        except Exception as e:
            check(f"{label} reachable", False, str(e)[:70])

    # ---- API payloads ----------------------------------------------------
    section("API")
    mixes = scenes = None
    try:
        with request(f"{API}/api/mixes", origin=SITE) as r:
            mixes = json.load(r)
        check("/api/mixes returns data", len(mixes) > 0, f"{len(mixes)} mixes")
    except Exception as e:
        check("/api/mixes returns data", False, str(e)[:70])

    try:
        with request(f"{API}/api/scenes?limit=50", origin=SITE) as r:
            scenes = json.load(r)["results"]
        check("/api/scenes returns data", len(scenes) > 0, f"{len(scenes)} scenes")
    except Exception as e:
        check("/api/scenes returns data", False, str(e)[:70])

    if mixes:
        stale = [m for m in mixes if m["audio_path"].startswith("public/assets/")]
        check(
            "mix paths are R2 keys, not old repo paths",
            not stale,
            f"{len(stale)} rows still using public/assets/" if stale else "",
        )
        no_tracks = [m for m in mixes if not m.get("tracks")]
        check(
            "mixes carry tracklists",
            len(no_tracks) <= 2,
            f"{len(no_tracks)} without a tracklist",
        )

    # ---- CORS ------------------------------------------------------------
    section("CORS")
    for origin, should_allow in [
        (SITE, True),
        ("https://www.weebtrax.com", True),
        ("https://evil.example", False),
    ]:
        try:
            with request(f"{API}/api/mixes", origin=origin) as r:
                got = r.headers.get("access-control-allow-origin")
        except Exception:
            got = None
        allowed = got == origin
        check(
            f"origin {origin} {'allowed' if should_allow else 'refused'}",
            allowed == should_allow,
            f"header: {got!r}",
        )

    # ---- media -----------------------------------------------------------
    section("Media")
    paths = []
    if mixes:
        paths += [m["audio_path"] for m in mixes]
    if scenes:
        for s in scenes:
            paths += [s["video_path"], s["thumbnail_path"]]

    def head(p):
        try:
            with request(f"{MEDIA}/{urllib.parse.quote(p)}", method="HEAD") as r:
                return p, r.status, r.headers.get("Content-Type", "")
        except Exception as e:
            return p, getattr(e, "code", "ERR"), ""

    if paths:
        with ThreadPoolExecutor(max_workers=12) as ex:
            media = list(ex.map(head, paths))
        bad = [m for m in media if m[1] != 200]
        check(
            f"all {len(paths)} media files load from R2",
            not bad,
            f"{len(bad)} failed, e.g. {bad[0][0]}" if bad else "",
        )
        wrong_type = [
            m for m in media
            if m[1] == 200 and not any(
                m[2].startswith(t) for t in ("audio/", "video/", "image/")
            )
        ]
        check("media served with correct content types", not wrong_type)

        # audio seeking needs range support
        try:
            with request(
                f"{MEDIA}/{urllib.parse.quote(paths[0])}",
                headers={"Range": "bytes=0-99"},
            ) as r:
                check("range requests supported (audio seeking)", r.status == 206,
                      f"HTTP {r.status}")
        except Exception as e:
            check("range requests supported (audio seeking)", False, str(e)[:70])

    # ---- frontend wiring -------------------------------------------------
    section("Frontend wiring")
    core = (REPO / "production/js/core.js").read_text()
    app = (REPO / "production/js/app.js").read_text()

    check(
        "WT_MEDIA_BASE points at media.weebtrax.com for production",
        "https://media.weebtrax.com" in core,
    )
    check(
        "WT_API_BASE points at api.weebtrax.com for production",
        "https://api.weebtrax.com/api" in app,
    )
    # a hardcoded localhost outside the localhost branch would break production
    for fname, text in [("core.js", core), ("app.js", app)]:
        hardcoded = re.findall(r"['\"]https?://localhost[^'\"]*['\"]", text)
        stray = [h for h in hardcoded if "8000" not in h and "3000" not in h]
        check(f"{fname} has no stray localhost URLs", not stray, str(stray[:2]))

    # Media URLs must be built from WT_MEDIA_BASE. A bare "'/' + m.audioPath"
    # would resolve against whatever host the page is on, which works locally
    # and 404s in production. Check line by line so the WT_MEDIA_BASE prefix
    # isn't mistaken for the bug it's the fix for.
    for fname in ["production/js/sections1.js", "production/js/sections2.js"]:
        bad = [
            line.strip()
            for line in (REPO / fname).read_text().splitlines()
            if re.search(r"'/' \+ (?:s|m)\.(?:audioPath|videoPath|thumbnailPath)", line)
            and "WT_MEDIA_BASE" not in line
        ]
        check(f"{Path(fname).name} uses WT_MEDIA_BASE, not a bare '/'", not bad,
              str(bad[:2]))

    # ---- summary ---------------------------------------------------------
    failed = [r for r in results if not r[1]]
    print("\n" + "=" * 40)
    print(f"{len(results) - len(failed)}/{len(results)} checks passed")
    if failed:
        print("\nFAILED:")
        for name, _, detail in failed:
            print(f"  - {name}" + (f" ({detail})" if detail else ""))
        return 1
    print("All checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
