#!/usr/bin/env python3
"""
Generate WeebTrax favicon assets from the brand icon source.

Outputs (all in brand/favicon/):
  favicon.svg              scalable SVG (embeds icon as base64 — scales to any size)
  favicon-16x16.png        browser tab fallback
  favicon-32x32.png        standard browser tab
  favicon-48x48.png        Windows site icon / taskbar
  favicon-96x96.png        Google TV / some Android launchers
  apple-touch-icon.png     iOS home screen (180x180)
  icon-192.png             Android PWA / manifest
  icon-512.png             PWA splash screen / manifest
  favicon.ico              multi-size ICO (16, 32, 48) — auto-served at /favicon.ico
"""

import base64
import io
import os
from pathlib import Path

from PIL import Image

SCRIPT_DIR = Path(__file__).parent
SRC        = SCRIPT_DIR.parent / "icon" / "weebtrax-icon-source.png"
OUT_DIR    = SCRIPT_DIR

# Match the brand/icon fill ratio so favicon looks identical to brand icon exports
MASTER_PX  = 1024
ICON_FILL  = 0.7422
ICON_PX    = round(MASTER_PX * ICON_FILL)  # 760 px

PNG_SIZES  = [16, 32, 48, 96]
NAMED_PNGS = {
    "apple-touch-icon.png": 180,
    "icon-192.png":         192,
    "icon-512.png":         512,
}
ICO_SIZES  = [(16, 16), (32, 32), (48, 48)]


def make_master() -> Image.Image:
    src = Image.open(SRC).convert("RGBA")
    alpha_bbox = src.split()[3].getbbox()
    icon = src.crop(alpha_bbox)

    w, h  = icon.size
    scale = ICON_PX / max(w, h)
    icon  = icon.resize((round(w * scale), round(h * scale)), Image.LANCZOS)

    canvas = Image.new("RGBA", (MASTER_PX, MASTER_PX), (0, 0, 0, 0))
    x = (MASTER_PX - icon.width)  // 2
    y = (MASTER_PX - icon.height) // 2
    canvas.paste(icon, (x, y), icon)
    return canvas


def save_png(img: Image.Image, size: int, name: str | None = None) -> Path:
    scaled = img.resize((size, size), Image.LANCZOS)
    path   = OUT_DIR / (name or f"favicon-{size}x{size}.png")
    scaled.save(path, "PNG", optimize=True)
    print(f"  {path.name}  ({size}×{size})")
    return path


def save_ico(img: Image.Image) -> None:
    path = OUT_DIR / "favicon.ico"
    # Build a composite image at the largest ICO size; Pillow auto-downscales
    master = img.resize((48, 48), Image.LANCZOS)
    master.save(path, format="ICO", sizes=ICO_SIZES)
    sizes_str = ", ".join(f"{w}×{h}" for w, h in ICO_SIZES)
    print(f"  favicon.ico  ({sizes_str})")


def save_svg(img: Image.Image) -> None:
    # Encode the 512px PNG as base64 and embed in an SVG <image>
    buf = io.BytesIO()
    img.resize((512, 512), Image.LANCZOS).save(buf, "PNG", optimize=True)
    b64 = base64.b64encode(buf.getvalue()).decode()

    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">\n'
        f'  <image width="512" height="512"'
        f' href="data:image/png;base64,{b64}"/>\n'
        '</svg>\n'
    )
    path = OUT_DIR / "favicon.svg"
    path.write_text(svg, encoding="utf-8")
    print(f"  favicon.svg  (scalable, embeds 512px PNG as base64)")


if __name__ == "__main__":
    print(f"Source : {SRC}")
    print(f"Master : {MASTER_PX}×{MASTER_PX}, icon fill {ICON_FILL*100:.1f}%\n")

    master = make_master()

    print("PNG exports:")
    for size in PNG_SIZES:
        save_png(master, size)
    for name, size in NAMED_PNGS.items():
        save_png(master, size, name)

    print("\nICO export:")
    save_ico(master)

    print("\nSVG export:")
    save_svg(master)

    print("\nDone.")
