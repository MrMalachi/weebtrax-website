"""
Generates profile-picture images at each platform's recommended upload
dimensions: a transparent background, the WeebTrax mascot centered on top,
and a dark gray circle showing the final circular crop zone.

Run: cd brand/socials && python3 gen_profile_placeholders.py
"""

import os
import sys

try:
    from PIL import Image, ImageDraw
except ImportError:
    sys.exit(
        "Missing dependency: Pillow is required.\n"
        "Install it with:  pip install Pillow"
    )

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))
MASCOT_PATH = os.path.join(OUTPUT_DIR, "..", "mascot", "weebtrax_mascot_4096.png")

PLATFORMS = [
    {"name": "Instagram", "size": 1080, "file": "instagram_profile.png"},
    {"name": "SoundCloud", "size": 1000, "file": "soundcloud_profile.png"},
    {"name": "TikTok", "size": 720, "file": "tiktok_profile.png"},
    {"name": "YouTube", "size": 800, "file": "youtube_profile.png"},
]

CROP_CIRCLE_COLOR = "#4A4A4A"
CROP_CIRCLE_MARGIN_RATIO = 0.05  # inset from the canvas edge
CROP_CIRCLE_OPACITY = 90         # 0-255; keeps the circle "subtle"

MASCOT_MARGIN_RATIO = 0.08  # inset from the canvas edge for the mascot artwork


def load_mascot():
    if not os.path.exists(MASCOT_PATH):
        sys.exit(f"Mascot source not found: {os.path.abspath(MASCOT_PATH)}")
    return Image.open(MASCOT_PATH).convert("RGBA")


def draw_crop_circle(canvas, size):
    overlay = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    margin = int(size * CROP_CIRCLE_MARGIN_RATIO)
    r, g, b = ImageDraw.ImageColor.getrgb(CROP_CIRCLE_COLOR)
    draw.ellipse(
        [margin, margin, size - margin, size - margin],
        outline=(r, g, b, CROP_CIRCLE_OPACITY),
        width=max(2, size // 150),
    )
    canvas.alpha_composite(overlay)


def draw_mascot(canvas, size, mascot):
    margin = int(size * MASCOT_MARGIN_RATIO)
    max_dim = size - margin * 2
    scale = min(max_dim / mascot.width, max_dim / mascot.height)
    new_w, new_h = int(mascot.width * scale), int(mascot.height * scale)
    resized = mascot.resize((new_w, new_h), Image.LANCZOS)

    x = (size - new_w) // 2
    y = (size - new_h) // 2
    canvas.alpha_composite(resized, (x, y))


def make_profile_image(size, filename, mascot):
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw_mascot(canvas, size, mascot)
    draw_crop_circle(canvas, size)

    out_path = os.path.join(OUTPUT_DIR, filename)
    canvas.save(out_path, "PNG", optimize=True)
    print(f"wrote {out_path} ({size}x{size})")


if __name__ == "__main__":
    mascot_img = load_mascot()
    for platform in PLATFORMS:
        make_profile_image(platform["size"], platform["file"], mascot_img)
