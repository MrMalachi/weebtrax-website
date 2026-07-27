#!/usr/bin/env python3
"""
Generate WeebTrax primary wordmark.
Outputs black and white variants at 4000x1000 (transparent PNG).
"""

from PIL import Image, ImageDraw, ImageFont

FONT_PATH = "../countdown/fonts/loveletter.ttf"
TEXT      = "WEEBTRAX"
W, H      = 4000, 1000

# Target: fill ~78% of height, then check width fits within 90% of canvas
TARGET_H_RATIO = 0.78
MAX_W_RATIO    = 0.90


def fit_font_size() -> tuple[ImageFont.FreeTypeFont, tuple[int,int,int,int]]:
    # Binary search: largest size where text height <= target
    lo, hi = 10, 3000
    dummy = Image.new("RGBA", (1, 1))
    draw  = ImageDraw.Draw(dummy)

    while lo < hi - 1:
        mid  = (lo + hi) // 2
        font = ImageFont.truetype(FONT_PATH, mid)
        bbox = draw.textbbox((0, 0), TEXT, font=font)
        if (bbox[3] - bbox[1]) <= int(H * TARGET_H_RATIO):
            lo = mid
        else:
            hi = mid

    # Check width; shrink if needed
    font = ImageFont.truetype(FONT_PATH, lo)
    bbox = draw.textbbox((0, 0), TEXT, font=font)
    while (bbox[2] - bbox[0]) > int(W * MAX_W_RATIO) and lo > 10:
        lo  -= 1
        font = ImageFont.truetype(FONT_PATH, lo)
        bbox = draw.textbbox((0, 0), TEXT, font=font)

    return font, bbox


def render(color: tuple[int,int,int,int], out_path: str) -> None:
    font, bbox = fit_font_size()
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]

    img  = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    x = (W - tw) // 2 - bbox[0]
    y = (H - th) // 2 - bbox[1]

    draw.text((x, y), TEXT, font=font, fill=color)
    img.save(out_path, "PNG")
    print(f"  {out_path}  ({tw}×{th} text, font size {font.size})")


if __name__ == "__main__":
    print(f"Canvas: {W}×{H}")
    render((0, 0, 0, 255),       "weebtrax-wordmark-black.png")
    render((255, 255, 255, 255), "weebtrax-wordmark-white.png")
    print("Done.")
