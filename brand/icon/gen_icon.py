#!/usr/bin/env python3
"""
Produce the WeebTrax brand icon at all standard sizes.
Source image is taken as-is — no edits, recolouring, or effects.
The only operation is: crop to alpha content → scale → centre on canvas.
"""

import os
from PIL import Image

SRC        = os.path.join(os.path.dirname(os.path.abspath(__file__)), "weebtrax-icon-source.png")
OUT_DIR    = os.path.dirname(os.path.abspath(__file__))

MASTER_PX  = 1024          # master canvas (square)
ICON_FILL  = 0.7422        # 760 / 1024  — keeps icon at ~760 px on the master
ICON_PX    = round(MASTER_PX * ICON_FILL)   # 760 px

EXPORT_SIZES = [512, 256, 128, 64, 48, 32, 16]


def make_master(src_path: str) -> Image.Image:
    src = Image.open(src_path).convert("RGBA")

    # Crop to non-transparent content so we scale the real icon, not its framing
    alpha_bbox = src.split()[3].getbbox()
    icon = src.crop(alpha_bbox)

    # Scale so the larger dimension == ICON_PX, preserving aspect ratio exactly
    w, h   = icon.size
    scale  = ICON_PX / max(w, h)
    new_w  = round(w * scale)
    new_h  = round(h * scale)
    icon   = icon.resize((new_w, new_h), Image.LANCZOS)

    # Centre on a transparent MASTER_PX × MASTER_PX canvas
    canvas = Image.new("RGBA", (MASTER_PX, MASTER_PX), (0, 0, 0, 0))
    x = (MASTER_PX - new_w) // 2
    y = (MASTER_PX - new_h) // 2
    canvas.paste(icon, (x, y), icon)

    return canvas


def export(master: Image.Image, size: int) -> None:
    scaled = master.resize((size, size), Image.LANCZOS)
    path   = os.path.join(OUT_DIR, f"weebtrax-icon-{size}.png")
    scaled.save(path, "PNG", optimize=True)
    print(f"  {path}  ({size}×{size})")


if __name__ == "__main__":
    print(f"Source : {SRC}")
    print(f"Master : {MASTER_PX}×{MASTER_PX}, icon target {ICON_PX}px ({ICON_FILL*100:.1f}%)")

    master      = make_master(SRC)
    master_path = os.path.join(OUT_DIR, "weebtrax-icon-1024.png")
    master.save(master_path, "PNG", optimize=True)
    print(f"\nMaster : {master_path}")

    print("\nExports:")
    for size in EXPORT_SIZES:
        export(master, size)

    print("\nDone.")
