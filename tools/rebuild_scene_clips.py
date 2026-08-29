#!/usr/bin/env python3
"""
Re-encodes all 48 scene clips from the flash drive's raw scene-detect output
into production/public/assets/scenes/videos/, normalizing every clip to
standard 8-bit yuv420p H.264 (the flash drive originals were lossless stream
copies straight from the hi10p BDRip source, so 9 of them inherited 10-bit
color that most browsers/players can't decode reliably).

RENAME_MAP is copied verbatim from tools/generate_scenes_json.py — that file
is the single source of truth for which raw clip maps to which final
episode-XX_clip-NN slug. Keep the two in sync if scenes.json ever changes.
"""

import subprocess
import sys
from pathlib import Path

SOURCE_ROOT = Path("/Volumes/WeebTrax/lain-episodes/tools/scene-detect")
DEST_DIR = Path(__file__).parent.parent / "production/public/assets/scenes/videos"

RENAME_MAP = {
    "episode-01_clip_t0010s": "episode-01_clip-01",
    "episode-01_clip_t0050s": "episode-01_clip-02",
    "episode-01_clip_t0060s": "episode-01_clip-03",
    "episode-01_clip_t0130s": "episode-01_clip-04",
    "episode-01_clip_t0150s": "episode-01_clip-05",
    "episode-01_clip_t0180s": "episode-01_clip-06",
    "episode-01_clip_t0200s": "episode-01_clip-07",
    "episode-01_clip_t0530s": "episode-01_clip-08",
    "episode-01_clip_t0540s": "episode-01_clip-09",
    "episode-01_clip_t0680s": "episode-01_clip-10",
    "episode-01_clip_t0720s": "episode-01_clip-11",
    "episode-01_clip_t0760s": "episode-01_clip-12",
    "episode-01_clip_t0790s": "episode-01_clip-14",
    "episode-01_clip_t0860s": "episode-01_clip-15",
    "episode-01_clip_t0860sseg2": "episode-01_clip-16",
    "episode-01_clip_t0880s": "episode-01_clip-17",
    "episode-01_clip_t1150s": "episode-01_clip-18",
    "episode-02_clip_t1010s": "episode-02_clip-01",
    "episode-02_clip_t1050s": "episode-02_clip-02",
    "episode-02_clip_t1050sseg2": "episode-02_clip-03",
    "episode-02_clip_t1060s": "episode-02_clip-05",
    "episode-02_clip_t1060sseg3": "episode-02_clip-07",
    "episode-03_clip_t0810s": "episode-03_clip-01",
    "episode-03_clip_t0810sseg2": "episode-03_clip-02",
    "episode-03_clip_t0860s": "episode-03_clip-03",
    "episode-03_clip_t0860sseg2": "episode-03_clip-04",
    "episode-03_clip_t0860sseg3": "episode-03_clip-05",
    "episode-04_clip_t0600s": "episode-04_clip-01",
    "episode-04_clip_t0610s": "episode-04_clip-02",
    "episode-04_clip_t0680s": "episode-04_clip-03",
    "episode-04_clip_t0730s": "episode-04_clip-04",
    "episode-05_clip_t0200s": "episode-05_clip-01",
    "episode-05_clip_t0660s": "episode-05_clip-02",
    "episode-05_clip_t0670s": "episode-05_clip-03",
    "episode-06_clip_t0610s": "episode-06_clip-01",
    "episode-06_clip_t0800s": "episode-06_clip-02",
    "episode-06_clip_t0820s": "episode-06_clip-03",
    "episode-07_clip_t0410s": "episode-07_clip-01",
    "episode-08_clip_t0150s": "episode-08_clip-01",
    "episode-10_clip_t0820s": "episode-10_clip-01",
    "episode-11_clip_t1160s": "episode-11_clip-02",
    "episode-12_clip_t0670s": "episode-12_clip-01",
    "episode-13_clip_t0660s": "episode-13_clip-01",
    "episode-13_clip_t0720s": "episode-13_clip-02",
}


def source_path(old_slug: str) -> Path:
    # old_slug looks like "episode-01_clip_t0010s" or "episode-01_clip_t0760sseg2"
    episode_dir, clip_name = old_slug.split("_clip_", 1)
    return SOURCE_ROOT / episode_dir / "clips" / f"clip_{clip_name}.mp4"


def reencode(src: Path, dst: Path) -> bool:
    cmd = [
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-i", str(src),
        "-map", "0:v:0",
        "-c:v", "libx264",
        "-profile:v", "high",
        "-pix_fmt", "yuv420p",
        "-crf", "18",
        "-preset", "medium",
        "-movflags", "+faststart",
        "-an",
        str(dst),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"  FAILED: {result.stderr.strip()[:300]}")
        return False
    return True


def main():
    DEST_DIR.mkdir(parents=True, exist_ok=True)

    missing = []
    failed = []
    done = 0

    total = len(RENAME_MAP)
    for i, (old_slug, new_slug) in enumerate(sorted(RENAME_MAP.items()), 1):
        src = source_path(old_slug)
        dst = DEST_DIR / f"{new_slug}.mp4"

        print(f"[{i}/{total}] {old_slug} -> {new_slug}.mp4", end=" ", flush=True)

        if not src.exists():
            print(f"MISSING SOURCE: {src}")
            missing.append(old_slug)
            continue

        if reencode(src, dst):
            print("ok")
            done += 1
        else:
            failed.append(old_slug)

    print(f"\nDone. {done}/{total} clips re-encoded into {DEST_DIR}")
    if missing:
        print(f"\nMissing source files ({len(missing)}):")
        for m in missing:
            print(f"  {m}")
    if failed:
        print(f"\nFailed re-encodes ({len(failed)}):")
        for f in failed:
            print(f"  {f}")

    if missing or failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
