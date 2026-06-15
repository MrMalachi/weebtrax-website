#!/usr/bin/env python3
"""
For each Lain episode (02–13):
  1. Extract one JPEG frame every 10 seconds using ffmpeg
  2. Build 5-column × 6-row contact sheets with ImageMagick montage
  3. Delete the individual frames to save drive space

Output lands in:
  /Volumes/WeebTrax/lain-episodes/tools/scene-detect/episode-XX/
    contact-sheet-001.jpg
    contact-sheet-002.jpg
    ...
"""

import subprocess
import os
import sys
import glob
from PIL import Image

VIDEO_DIR = "/Volumes/WeebTrax/lain-episodes"
SCENE_DIR = "/Volumes/WeebTrax/lain-episodes/tools/scene-detect"

COLS = 5
ROWS = 6
PER_SHEET = COLS * ROWS          # 30 thumbnails per sheet
THUMB_W = 240                    # px — matches EP01 sheets
THUMB_H = 171                    # px — 240 × (1080/1520) ≈ 171
EPISODES = range(2, 14)          # 02 – 13


def run(cmd, **kwargs):
    return subprocess.run(cmd, check=True, **kwargs)


def get_duration(video_path):
    result = subprocess.run(
        [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            video_path,
        ],
        capture_output=True, text=True, check=True,
    )
    return float(result.stdout.strip())


def process_episode(ep_num):
    ep_str = f"{ep_num:02d}"
    video = os.path.join(VIDEO_DIR, f"Serial_Experiments_Lain_{ep_str}_BDRip_hi10p_1080p.mkv")

    if not os.path.exists(video):
        print(f"[EP{ep_str}] SKIP — file not found: {video}")
        return

    ep_dir = os.path.join(SCENE_DIR, f"episode-{ep_str}")
    frames_dir = os.path.join(ep_dir, "frames")
    os.makedirs(frames_dir, exist_ok=True)

    # ── 1. Extract frames ──────────────────────────────────────────────────
    duration = get_duration(video)
    expected = int(duration / 10) + 1
    print(f"\n[EP{ep_str}] Duration {duration:.1f}s → ~{expected} frames")

    existing_frames = sorted(glob.glob(os.path.join(frames_dir, "frame_*.jpg")))
    if existing_frames:
        print(f"[EP{ep_str}] {len(existing_frames)} frames already exist, skipping extraction")
    else:
        print(f"[EP{ep_str}] Extracting frames to {frames_dir} ...")
        run([
            "ffmpeg", "-hide_banner", "-loglevel", "error",
            "-i", video,
            "-vf", "fps=1/10",       # one frame every 10 seconds (no upscaling)
            "-q:v", "2",             # high JPEG quality
            os.path.join(frames_dir, "frame_%04d.jpg"),
        ])

    frames = sorted(glob.glob(os.path.join(frames_dir, "frame_*.jpg")))
    print(f"[EP{ep_str}] {len(frames)} frames extracted")

    if not frames:
        print(f"[EP{ep_str}] ERROR — no frames found, skipping sheets")
        return

    # ── 2. Build contact sheets ────────────────────────────────────────────
    sheet_num = 1
    for start in range(0, len(frames), PER_SHEET):
        batch = frames[start : start + PER_SHEET]
        sheet_path = os.path.join(ep_dir, f"contact-sheet-{sheet_num:03d}.jpg")
        print(f"[EP{ep_str}] Sheet {sheet_num:03d} ({len(batch)} thumbs) → {os.path.basename(sheet_path)}")

        sheet_img = Image.new("RGB", (COLS * THUMB_W, ROWS * THUMB_H), color="black")
        for idx, frame_path in enumerate(batch):
            thumb = Image.open(frame_path).resize((THUMB_W, THUMB_H), Image.LANCZOS)
            x = (idx % COLS) * THUMB_W
            y = (idx // COLS) * THUMB_H
            sheet_img.paste(thumb, (x, y))
        sheet_img.save(sheet_path, "JPEG", quality=85)
        sheet_num += 1

    sheets_made = sheet_num - 1
    print(f"[EP{ep_str}] {sheets_made} contact sheet(s) created")

    # ── 3. Clean up individual frames ─────────────────────────────────────
    for f in frames:
        os.remove(f)
    os.rmdir(frames_dir)
    print(f"[EP{ep_str}] Frames deleted (keeping only contact sheets)")


def main():
    for ep in EPISODES:
        process_episode(ep)
    print("\nAll done.")


if __name__ == "__main__":
    main()
