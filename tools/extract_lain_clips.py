#!/usr/bin/env python3
"""
Extract 10-second MP4 clips for every thumbnail in the episode-01 contact sheets.

Grid layout: 5 columns x 6 rows = 30 thumbnails per sheet, every 10 seconds.
Clips are named sheet-NNN_row-R_col-C_tTTTTTs.mp4 so they map directly back
to the contact sheets.
"""

import subprocess
import os
import sys

VIDEO = "/Volumes/WeebTrax/lain-episodes/Serial_Experiments_Lain_01_BDRip_hi10p_1080p.mkv"
EPISODE = "01"
OUTPUT_DIR = f"/Volumes/WeebTrax/lain-episodes/tools/scene-detect/episode-{EPISODE}/clips"
INTERVAL = 10       # seconds between thumbnails
COLS = 5
ROWS_PER_SHEET = 6
PER_SHEET = COLS * ROWS_PER_SHEET  # 30 per sheet
VIDEO_DURATION = 1436.96


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Timestamps: 0, 10, 20, ..., floor(duration/interval)*interval
    total = int(VIDEO_DURATION / INTERVAL) + 1  # 144 clips (t=0..1430)

    print(f"Extracting {total} clips to {OUTPUT_DIR}")
    print(f"Source: {VIDEO}")
    print()

    errors = []

    for i in range(total):
        t_start = i * INTERVAL
        duration = min(INTERVAL, VIDEO_DURATION - t_start)
        if duration <= 0:
            break

        sheet = (i // PER_SHEET) + 1
        pos = i % PER_SHEET
        row = (pos // COLS) + 1
        col = (pos % COLS) + 1

        filename = f"sheet-{sheet:03d}_row-{row:02d}_col-{col:02d}_t{t_start:05d}s.mp4"
        output_path = os.path.join(OUTPUT_DIR, filename)

        if os.path.exists(output_path):
            print(f"[{i+1:3d}/{total}] skip  {filename}")
            continue

        print(f"[{i+1:3d}/{total}] clip  {filename}  (t={t_start}s, {duration:.1f}s)", end="", flush=True)

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
