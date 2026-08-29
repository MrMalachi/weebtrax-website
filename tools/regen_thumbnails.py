#!/usr/bin/env python3
"""
Regenerate scene thumbnails from the final production video clips at full
frame resolution (previously downgraded to a cropped 400x100 sliver by
tools/regen_thumbnails_400x100.py). Extracts a mid-point frame from each
production/public/assets/scenes/videos/episode-XX_clip-NN.mp4 and scales it
to 960px wide, preserving native aspect ratio, no forced crop.
"""

import subprocess
import os
import glob

REPO_ROOT = os.path.join(os.path.dirname(__file__), "..")
VIDEO_DIR = os.path.join(REPO_ROOT, "production/public/assets/scenes/videos")
THUMB_DIR = os.path.join(REPO_ROOT, "production/public/assets/scenes/thumbnails")
OUT_WIDTH = 960


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


def regen(video_path, thumb_path):
    name = os.path.basename(thumb_path)
    dur = get_duration(video_path)
    mid = dur / 2.0

    result = subprocess.run([
        "ffmpeg", "-hide_banner", "-loglevel", "error",
        "-ss", f"{mid:.3f}",
        "-i", video_path,
        "-vframes", "1",
        "-vf", f"scale={OUT_WIDTH}:-2",
        "-q:v", "2",
        "-y",
        thumb_path,
    ])

    if result.returncode != 0:
        print(f"  FAILED: {name}")
        return

    size_kb = os.path.getsize(thumb_path) // 1024
    print(f"  {name} ({size_kb} KB)")


def main():
    videos = sorted(glob.glob(os.path.join(VIDEO_DIR, "*.mp4")))
    print(f"Regenerating {len(videos)} thumbnails from final video clips...\n")
    for video_path in videos:
        stem = os.path.splitext(os.path.basename(video_path))[0]
        thumb_path = os.path.join(THUMB_DIR, f"{stem}.jpg")
        if not os.path.exists(thumb_path):
            print(f"  SKIP (no existing thumbnail for): {stem}")
            continue
        regen(video_path, thumb_path)
    print("\nDone.")


if __name__ == "__main__":
    main()
