#!/usr/bin/env python3
"""
Scans the scene clip .mp4 files on the WeebTrax flash drive and flags which
ones are actually truncated (need to be re-cut from the source episode)
versus which just have a broken/misleading index and can likely be fixed
with a fast remux.

Usage:
    python3 tools/check_scene_clips.py [root_dir]

Default root_dir: /Volumes/WeebTrax/lain-episodes/tools/scene-detect
"""

import json
import subprocess
import sys
from pathlib import Path

DEFAULT_ROOT = "/Volumes/WeebTrax/lain-episodes/tools/scene-detect"

# How much shorter than the container's declared duration a clip's last
# readable timestamp can be before we call it "truncated" rather than just
# a rounding/keyframe artifact.
TRUNCATION_THRESHOLD_SECS = 1.0


def ffprobe_json(path: Path, args: list[str]) -> dict | None:
    result = subprocess.run(
        ["ffprobe", "-v", "error", *args, "-of", "json", str(path)],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        return None
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError:
        return None


def declared_duration(path: Path) -> float | None:
    data = ffprobe_json(path, ["-show_entries", "format=duration"])
    if not data:
        return None
    try:
        return float(data["format"]["duration"])
    except (KeyError, TypeError, ValueError):
        return None


def last_readable_timestamp(path: Path) -> float | None:
    """
    Decodes packet timestamps to find how far into the file ffmpeg can
    actually read, independent of what the container header claims.
    """
    data = ffprobe_json(
        path,
        [
            "-select_streams", "v:0",
            "-show_entries", "packet=pts_time",
            "-read_intervals", "%+#100000",
        ],
    )
    if not data:
        return None
    packets = data.get("packets", [])
    times = [float(p["pts_time"]) for p in packets if "pts_time" in p]
    return max(times) if times else None


def pixel_format(path: Path) -> str | None:
    data = ffprobe_json(
        path,
        ["-select_streams", "v:0", "-show_entries", "stream=pix_fmt"],
    )
    if not data:
        return None
    streams = data.get("streams", [])
    return streams[0].get("pix_fmt") if streams else None


def decode_probe(path: Path) -> dict:
    """
    Actually decodes the video stream (not just reading packet headers) to
    catch frame-level corruption that stalls playback even when the
    container's index/packet list looks complete. Returns how far decoding
    got and any error lines ffmpeg printed along the way.
    """
    result = subprocess.run(
        [
            "ffmpeg", "-v", "error", "-xerror",
            "-i", str(path),
            "-map", "0:v:0",
            "-f", "null", "-",
        ],
        capture_output=True,
        text=True,
    )
    return {
        "returncode": result.returncode,
        "stderr": result.stderr.strip(),
    }


def classify(path: Path) -> dict:
    declared = declared_duration(path)
    actual = last_readable_timestamp(path)
    decode = decode_probe(path)
    pix_fmt = pixel_format(path)
    ten_bit = bool(pix_fmt and "10" in pix_fmt)

    if declared is None or actual is None:
        return {
            "path": str(path),
            "status": "UNREADABLE",
            "declared": declared,
            "actual": actual,
            "decode_error": decode["stderr"] or None,
            "pix_fmt": pix_fmt,
            "ten_bit": ten_bit,
        }

    gap = declared - actual
    if gap > TRUNCATION_THRESHOLD_SECS:
        status = "TRUNCATED"  # needs re-cut from source episode
    elif decode["returncode"] != 0 or decode["stderr"]:
        status = "DECODE_ERROR"  # container/index look fine, but frame data is corrupt
    elif ten_bit:
        status = "TEN_BIT_COMPAT_RISK"  # file is fine per ffmpeg, but many players/browsers can't decode 10-bit H.264 reliably
    else:
        status = "OK"

    return {
        "path": str(path),
        "status": status,
        "declared": round(declared, 2),
        "actual": round(actual, 2),
        "gap": round(gap, 2),
        "decode_error": decode["stderr"] or None,
        "pix_fmt": pix_fmt,
        "ten_bit": ten_bit,
    }


def main():
    root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(DEFAULT_ROOT)
    if not root.exists():
        print(f"Root path not found: {root}", file=sys.stderr)
        sys.exit(1)

    clips = sorted(
        p for p in root.glob("episode-*/clips/*.mp4")
        if not p.name.startswith("._")
    )
    if not clips:
        print(f"No .mp4 clips found under {root}", file=sys.stderr)
        sys.exit(1)

    results = []
    for i, clip in enumerate(clips, 1):
        print(f"[{i}/{len(clips)}] checking {clip.relative_to(root)}...", file=sys.stderr)
        results.append(classify(clip))

    ok = [r for r in results if r["status"] == "OK"]
    truncated = [r for r in results if r["status"] == "TRUNCATED"]
    decode_error = [r for r in results if r["status"] == "DECODE_ERROR"]
    ten_bit_risk = [r for r in results if r["status"] == "TEN_BIT_COMPAT_RISK"]
    unreadable = [r for r in results if r["status"] == "UNREADABLE"]

    print("\n=== Summary ===")
    print(f"Total clips checked: {len(results)}")
    print(f"OK: {len(ok)}")
    print(f"TRUNCATED (needs re-cut from source episode): {len(truncated)}")
    print(f"DECODE_ERROR (index looks fine, frame data corrupt — try remux, else re-cut): {len(decode_error)}")
    print(f"TEN_BIT_COMPAT_RISK (valid file, but 10-bit H.264 many players/browsers mishandle — re-encode to 8-bit): {len(ten_bit_risk)}")
    print(f"UNREADABLE (ffprobe couldn't open it at all): {len(unreadable)}")

    if truncated:
        print("\n--- TRUNCATED clips ---")
        for r in truncated:
            print(f"  {r['path']}  (declared {r['declared']}s, plays to {r['actual']}s, gap {r['gap']}s)")

    if decode_error:
        print("\n--- DECODE_ERROR clips ---")
        for r in decode_error:
            print(f"  {r['path']}")
            if r["decode_error"]:
                print(f"    {r['decode_error'][:300]}")

    if ten_bit_risk:
        print("\n--- TEN_BIT_COMPAT_RISK clips (re-encode to yuv420p 8-bit) ---")
        for r in ten_bit_risk:
            print(f"  {r['path']}  ({r['pix_fmt']})")

    if unreadable:
        print("\n--- UNREADABLE clips ---")
        for r in unreadable:
            print(f"  {r['path']}")

    out_path = Path(__file__).parent / "scene_clip_check_results.json"
    out_path.write_text(json.dumps(results, indent=2))
    print(f"\nFull results written to {out_path}")


if __name__ == "__main__":
    main()
