"""
Generates YouTube channel banners (2048x1152) from the wordmark-primary and
combination-logo horizontal source assets.

YouTube crops aggressively on mobile/TV, so the logo is scaled to fit inside
the universal "safe area" (centered 1546x423px) while the full 2048x1152
canvas is filled with a solid background:
  - black logo variants  -> white background (for light-mode / general use)
  - white logo variants  -> --void (#0a0b0e) background (matches site dark theme)

Run: cd brand/youtube-banner && python3 gen_youtube_banner.py
"""

from PIL import Image
import os

CANVAS_W, CANVAS_H = 2048, 1152
SAFE_W, SAFE_H = 1546, 423  # YouTube universal safe area

VOID = (10, 11, 14, 255)      # #0a0b0e — site dark background
WHITE = (255, 255, 255, 255)

BRAND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SOURCES = [
    # (source path, output name, background color)
    ("wordmark-primary/weebtrax-wordmark-black.png", "youtube-banner-wordmark-black.png", WHITE),
    ("wordmark-primary/weebtrax-wordmark-white.png", "youtube-banner-wordmark-white.png", VOID),
    ("combination-logo/weebtrax-logo-horizontal-black-3000px.png", "youtube-banner-combo-horizontal-black.png", WHITE),
    ("combination-logo/weebtrax-logo-horizontal-white-3000px.png", "youtube-banner-combo-horizontal-white.png", VOID),
]

def make_banner(src_rel, out_name, bg_color):
    src_path = os.path.join(BRAND_DIR, src_rel)
    logo = Image.open(src_path).convert("RGBA")

    # Scale logo to fit within the safe area, leaving a little breathing room
    max_w = int(SAFE_W * 0.82)
    max_h = int(SAFE_H * 0.82)
    scale = min(max_w / logo.width, max_h / logo.height)
    new_w, new_h = int(logo.width * scale), int(logo.height * scale)
    logo = logo.resize((new_w, new_h), Image.LANCZOS)

    canvas = Image.new("RGBA", (CANVAS_W, CANVAS_H), bg_color)
    x = (CANVAS_W - new_w) // 2
    y = (CANVAS_H - new_h) // 2
    canvas.alpha_composite(logo, (x, y))

    out_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), out_name)
    canvas.convert("RGB").save(out_path, "PNG")
    print(f"wrote {out_path} ({CANVAS_W}x{CANVAS_H})")

if __name__ == "__main__":
    for src_rel, out_name, bg_color in SOURCES:
        make_banner(src_rel, out_name, bg_color)
