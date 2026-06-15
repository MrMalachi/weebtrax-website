#!/usr/bin/env python3
"""
Regenerate all scene thumbnails at 400x100 (center-cropped).
Reads filenames from public/assets/scenes/thumbnails/, maps each to the
corresponding clip on the external drive, extracts a mid-point frame,
scales+crops to 400x100, and overwrites the existing JPEG.
"""

import subprocess
import os
import re
import glob

THUMB_DIR = os.path.join(
    os.path.dirname(__file__),
    "../public/assets/scenes/thumbnails"
)
CLIP_BASE = "/Volumes/WeebTrax/lain-episodes/tools/scene-detect"
W, H = 400, 100


def get_duration(clip_path):
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", clip_path],
        capture_output=True, text=True
    )
    try:
        return float(result.stdout.strip())
    except ValueError:
        return 1.0


def regen(thumb_path):
    name = os.path.basename(thumb_path)
    # Parse: episode-XX_clip_tXXXXs[segN].jpg
    m = re.match(r'episode-(\d+)_clip_(t\d+s(?:seg\d+)?)\.jpg', name)
    if not m:
        print(f"  SKIP (unrecognized name): {name}")
        return

    ep_str = m.group(1)
    clip_stem = m.group(2)  # e.g. t0010s or t0760sseg2
    clip_file = os.path.join(CLIP_BASE, f"episode-{ep_str}", "clips", f"clip_{clip_stem}.mp4")

    if not os.path.exists(clip_file):
        print(f"  SKIP (clip not found): {clip_file}")
        return

    dur = get_duration(clip_file)
    mid = dur / 2.0

    result = subprocess.run([
        "ffmpeg", "-hide_banner", "-loglevel", "error",
        "-ss", f"{mid:.3f}",
        "-i", clip_file,
        "-vframes", "1",
        "-vf", f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H}:(iw-{W})/2:(ih-{H})/2",
        "-q:v", "2",
        "-y",
        thumb_path,
    ])

    if result.returncode != 0:
        print(f"  FAILED: {name}")
        return

    size_kb = os.path.getsize(thumb_path) // 1024
    print(f"  {name} → {W}x{H} ({size_kb} KB)")


def main():
    thumbs = sorted(glob.glob(os.path.join(THUMB_DIR, "*.jpg")))
    print(f"Regenerating {len(thumbs)} thumbnails at {W}x{H}...\n")
    for t in thumbs:
        regen(t)
    print("\nDone.")


if __name__ == "__main__":
    main()
