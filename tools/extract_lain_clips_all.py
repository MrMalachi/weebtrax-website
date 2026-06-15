#!/usr/bin/env python3
"""
Extract the 49 unique Lain clips needed for the WeebTrax mix-matching system.
Each clip is 10 seconds, lossless stream copy, audio stripped.

Output: /Volumes/WeebTrax/lain-episodes/tools/scene-detect/episode-XX/clips/clip_t<timestamp>s.mp4
"""

import subprocess
import os
import json

VIDEO_DIR = "/Volumes/WeebTrax/lain-episodes"
SCENE_DIR = "/Volumes/WeebTrax/lain-episodes/tools/scene-detect"
MATCHES_JSON = os.path.join(
    os.path.dirname(__file__),
    "../media/mixes/metadata/lain-clip-matches.json"
)
CLIP_DURATION = 10


def video_path(episode):
    return os.path.join(
        VIDEO_DIR,
        f"Serial_Experiments_Lain_{episode}_BDRip_hi10p_1080p.mkv"
    )


def clip_path(episode, timestamp):
    clips_dir = os.path.join(SCENE_DIR, f"episode-{episode}", "clips")
    return os.path.join(clips_dir, f"clip_t{timestamp:04d}s.mp4")


def extract_clip(episode, timestamp):
    src = video_path(episode)
    dst = clip_path(episode, timestamp)

    if not os.path.exists(src):
        print(f"  SKIP — source not found: {src}")
        return False

    os.makedirs(os.path.dirname(dst), exist_ok=True)

    if os.path.exists(dst):
        print(f"  already exists, skipping")
        return True

    result = subprocess.run([
        "ffmpeg",
        "-hide_banner", "-loglevel", "error",
        "-ss", str(timestamp),
        "-i", src,
        "-t", str(CLIP_DURATION),
        "-c:v", "copy",
        "-an",
        "-avoid_negative_ts", "1",
        dst,
    ])

    if result.returncode != 0:
        print(f"  FAILED")
        return False

    size_kb = os.path.getsize(dst) // 1024
    print(f"  ok ({size_kb} KB)")
    return True


def main():
    with open(MATCHES_JSON) as f:
        matches = json.load(f)

    # Collect unique (episode, timestamp) pairs
    needed = sorted(set(
        (clip["episode"], clip["timestamp"])
        for m in matches
        for clip in m["clips"]
    ))

    print(f"Extracting {len(needed)} unique clips...\n")
    errors = []

    for episode, timestamp in needed:
        label = f"[EP{episode} t={timestamp}s]"
        print(f"{label}", end=" ", flush=True)
        ok = extract_clip(episode, timestamp)
        if not ok:
            errors.append((episode, timestamp))

    print(f"\nDone. {len(needed) - len(errors)}/{len(needed)} clips extracted.")
    if errors:
        print(f"\nFailed ({len(errors)}):")
        for ep, ts in errors:
            print(f"  EP{ep} t={ts}s")


if __name__ == "__main__":
    main()
