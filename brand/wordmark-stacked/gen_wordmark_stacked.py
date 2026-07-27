#!/usr/bin/env python3
"""
Generate WeebTrax stacked secondary wordmark.
"WEEB" over "TRAX" — both lines naturally identical width in Love Letter TW.
Canvas: 2000×2000 (square master).
"""

from PIL import Image, ImageDraw, ImageFont

FONT_PATH = "../countdown/fonts/loveletter.ttf"
LINE1     = "WEEB"
LINE2     = "TRAX"
CANVAS_W  = 2000
CANVAS_H  = 2000

# Target the wider line at 78% of canvas width
TARGET_W  = int(CANVAS_W * 0.78)


def measure(draw, text, font):
    bb = draw.textbbox((0, 0), text, font=font)
    return bb[2] - bb[0], bb[3] - bb[1], bb


def fit_font() -> tuple[ImageFont.FreeTypeFont, tuple, tuple]:
    dummy = Image.new("RGBA", (1, 1))
    d     = ImageDraw.Draw(dummy)

    lo, hi = 10, 2000
    while lo < hi - 1:
        mid  = (lo + hi) // 2
        font = ImageFont.truetype(FONT_PATH, mid)
        w1, _, _ = measure(d, LINE1, font)
        w2, _, _ = measure(d, LINE2, font)
        if max(w1, w2) <= TARGET_W:
            lo = mid
        else:
            hi = mid

    font = ImageFont.truetype(FONT_PATH, lo)
    w1, h1, bb1 = measure(d, LINE1, font)
    w2, h2, bb2 = measure(d, LINE2, font)
    return font, (w1, h1, bb1), (w2, h2, bb2)


def render(color: tuple[int,int,int,int], out_path: str) -> None:
    font, (w1, h1, bb1), (w2, h2, bb2) = fit_font()

    line_gap   = int(max(h1, h2) * 0.14)  # ~14% of line height between the two words
    block_h    = h1 + line_gap + h2
    y_offset   = (CANVAS_H - block_h) // 2

    img  = Image.new("RGBA", (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Line 1 — WEEB, centered
    x1 = (CANVAS_W - w1) // 2 - bb1[0]
    y1 = y_offset - bb1[1]
    draw.text((x1, y1), LINE1, font=font, fill=color)

    # Line 2 — TRAX, centered
    x2 = (CANVAS_W - w2) // 2 - bb2[0]
    y2 = y_offset + h1 + line_gap - bb2[1]
    draw.text((x2, y2), LINE2, font=font, fill=color)

    img.save(out_path, "PNG")
    print(f"  {out_path}")
    print(f"    canvas {CANVAS_W}×{CANVAS_H}  font {font.size}pt")
    print(f"    WEEB {w1}×{h1}  TRAX {w2}×{h2}  gap {line_gap}  block_h {block_h}")
    print(f"    top margin {y_offset}  bottom margin {CANVAS_H - y_offset - block_h}")


if __name__ == "__main__":
    render((0, 0, 0, 255),       "weebtrax-wordmark-stacked-black.png")
    render((255, 255, 255, 255), "weebtrax-wordmark-stacked-white.png")
    print("Done.")
