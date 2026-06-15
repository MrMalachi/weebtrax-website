#!/usr/bin/env python3
"""
Extract only the Lain EP01 clips needed for mix vibe-matching.
Clips are muted (-an) and video-stream-copied (lossless quality).
See lain-ep01-mix-matching.md for the full match table.
"""

import subprocess
import os
import sys

VIDEO = "/Volumes/WeebTrax/lain-episodes/Serial_Experiments_Lain_01_BDRip_hi10p_1080p.mkv"
EPISODE = "01"
OUTPUT_DIR = f"/Volumes/WeebTrax/lain-episodes/tools/scene-detect/episode-{EPISODE}/clips"
INTERVAL = 10
COLS = 5
ROWS_PER_SHEET = 6
PER_SHEET = COLS * ROWS_PER_SHEET  # 30
VIDEO_DURATION = 1436.96

# Only the timestamps we actually need — from lain-ep01-mix-matching.md
WANTED_TIMESTAMPS = sorted([
    10, 20, 50, 60, 130, 150,
    160, 170, 180, 200, 220, 240,
    250, 300, 310, 440, 530, 540,
    580, 640, 660, 670, 680, 720,
    760, 790, 800, 860, 880, 1050,
    1060, 1090, 1100, 1120, 1130, 1150,
    1160, 1180, 1190, 1270, 1280,
])


def make_filename(t_start):
    i = t_start // INTERVAL
    sheet = (i // PER_SHEET) + 1
    pos = i % PER_SHEET
    row = (pos // COLS) + 1
    col = (pos % COLS) + 1
    return f"sheet-{sheet:03d}_row-{row:02d}_col-{col:02d}_t{t_start:05d}s.mp4"


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    total = len(WANTED_TIMESTAMPS)
    print(f"Extracting {total} targeted clips to {OUTPUT_DIR}")
    print(f"Source: {VIDEO}\n")

    errors = []

    for idx, t_start in enumerate(WANTED_TIMESTAMPS, 1):
        duration = min(INTERVAL, VIDEO_DURATION - t_start)
        if duration <= 0:
            continue

        filename = make_filename(t_start)
        output_path = os.path.join(OUTPUT_DIR, filename)

        if os.path.exists(output_path):
            print(f"[{idx:2d}/{total}] skip  {filename}")
            continue

        print(f"[{idx:2d}/{total}] clip  {filename}  (t={t_start}s)", end="", flush=True)

        cmd = [
            "ffmpeg",
            "-hide_banner",
            "-loglevel", "error",
            "-ss", str(t_start),
            "-i", VIDEO,
            "-t", str(duration),
            "-c:v", "copy",   # lossless stream copy
            "-an",            # strip audio entirely
            "-avoid_negative_ts", "1",
            output_path,
        ]

        result = subprocess.run(cmd)
        if result.returncode != 0:
            print(" FAILED")
            errors.append(filename)
        else:
            print(" ok")

    print()
    if errors:
        print(f"Finished with {len(errors)} error(s):")
        for e in errors:
            print(f"  {e}")
        sys.exit(1)
    else:
        print(f"Done. {total} clips in {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
