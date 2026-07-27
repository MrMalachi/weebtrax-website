#!/usr/bin/env python3
"""
WeebTrax combination logo generator.
Combines CD icon + WEEBTRAX wordmark into horizontal and vertical lockups.

Assets are never modified — only scaled and positioned.
Outputs: SVG (embedded rasters) + PNG at 3000 / 2000 / 1000 px.
Both black (light bg) and white (dark bg) wordmark variants.
"""

import io, os, base64
from PIL import Image

BRAND   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.dirname(os.path.abspath(__file__))

CD_SRC   = os.path.join(BRAND, "icon",              "weebtrax-icon-source.png")
WM_BLACK = os.path.join(BRAND, "wordmark-primary",  "weebtrax-wordmark-black.png")
WM_WHITE = os.path.join(BRAND, "wordmark-primary",  "weebtrax-wordmark-white.png")

EXPORT_SIZES = [3000, 2000, 1000]


# ── helpers ──────────────────────────────────────────────────────────────────

def crop_alpha(path: str) -> Image.Image:
    """Load PNG and crop to non-transparent content."""
    img = Image.open(path).convert("RGBA")
    bb  = img.split()[3].getbbox()
    return img.crop(bb) if bb else img


def scale_h(img: Image.Image, target_h: int) -> Image.Image:
    w, h = img.size
    return img.resize((round(w * target_h / h), target_h), Image.LANCZOS)


def png_b64(img: Image.Image) -> str:
    buf = io.BytesIO()
    img.save(buf, "PNG")
    return base64.b64encode(buf.getvalue()).decode()


# ── lockup builders ───────────────────────────────────────────────────────────

def build_horizontal(cd_src: Image.Image,
                     wm_src: Image.Image,
                     cd_ref_h: int) -> tuple[Image.Image, dict]:
    """
    CD left · wordmark right · both vertically centred.
    CD height = full wordmark canvas height (~1.87× cap height) for visual balance.
    Gap       = 30 % of CD diameter.
    Clear     = 50 % of CD diameter on all four sides.
    """
    cd    = scale_h(cd_src, cd_ref_h)
    diam  = cd.width                             # CD is circular → width ≈ diameter

    gap   = round(diam * 0.30)
    clear = round(diam * 0.50)

    content_h = cd_ref_h                         # CD sets the content height
    cw = clear + cd.width + gap + wm_src.width + clear
    ch = clear + content_h + clear

    canvas = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))

    cd_x = clear
    cd_y = clear
    canvas.paste(cd, (cd_x, cd_y), cd)

    wm_x = clear + cd.width + gap
    wm_y = clear + (content_h - wm_src.height) // 2   # optically centre text in CD height
    canvas.paste(wm_src, (wm_x, wm_y), wm_src)

    positions = {
        "canvas": (cw, ch),
        "cd":     (cd_x, cd_y, cd.width,     cd.height),
        "wm":     (wm_x, wm_y, wm_src.width, wm_src.height),
    }
    return canvas, positions


def build_vertical(cd_src: Image.Image,
                   wm_src: Image.Image,
                   cd_ref_h: int) -> tuple[Image.Image, dict]:
    """
    CD on top · wordmark below · both horizontally centred.
    CD height = full wordmark canvas height for visual balance.
    Gap       = 50 % of CD diameter.
    Clear     = 50 % of CD diameter on all four sides.
    """
    cd    = scale_h(cd_src, cd_ref_h)
    diam  = cd.width

    gap   = round(diam * 0.50)
    clear = round(diam * 0.50)

    content_w = max(cd.width, wm_src.width)
    content_h = cd.height + gap + wm_src.height

    cw = content_w + 2 * clear
    ch = content_h + 2 * clear

    canvas = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))

    cd_x = (cw - cd.width)     // 2
    cd_y = clear
    canvas.paste(cd, (cd_x, cd_y), cd)

    wm_x = (cw - wm_src.width) // 2
    wm_y = clear + cd.height + gap
    canvas.paste(wm_src, (wm_x, wm_y), wm_src)

    positions = {
        "canvas": (cw, ch),
        "cd":     (cd_x, cd_y, cd.width,     cd.height),
        "wm":     (wm_x, wm_y, wm_src.width, wm_src.height),
    }
    return canvas, positions


# ── exporters ─────────────────────────────────────────────────────────────────

def export_pngs(img: Image.Image, stem: str) -> None:
    long = max(img.size)
    for size in EXPORT_SIZES:
        s      = size / long
        nw, nh = round(img.width * s), round(img.height * s)
        out    = img.resize((nw, nh), Image.LANCZOS)
        path   = os.path.join(OUT_DIR, f"{stem}-{size}px.png")
        out.save(path, "PNG", optimize=True)
        print(f"    PNG {size:4d}px  {nw}×{nh}  →  {os.path.basename(path)}")


def export_svg(cd_src: Image.Image,
               wm_src: Image.Image,
               positions: dict,
               stem: str) -> None:
    """
    SVG with the two source rasters embedded as separate <image> elements.
    Each element is positioned and sized according to the lockup geometry,
    letting the SVG renderer handle crisp scaling at any zoom level.
    """
    cw, ch = positions["canvas"]
    cx, cy, cdw, cdh = positions["cd"]
    wx, wy, wmw, wmh = positions["wm"]

    cd_data = png_b64(cd_src)
    wm_data = png_b64(wm_src)

    svg = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<svg xmlns="http://www.w3.org/2000/svg"\n'
        '     xmlns:xlink="http://www.w3.org/1999/xlink"\n'
        f'     width="{cw}" height="{ch}" viewBox="0 0 {cw} {ch}">\n'
        f'  <image x="{cx}" y="{cy}" width="{cdw}" height="{cdh}"\n'
        f'         href="data:image/png;base64,{cd_data}"\n'
        f'         xlink:href="data:image/png;base64,{cd_data}"/>\n'
        f'  <image x="{wx}" y="{wy}" width="{wmw}" height="{wmh}"\n'
        f'         href="data:image/png;base64,{wm_data}"\n'
        f'         xlink:href="data:image/png;base64,{wm_data}"/>\n'
        '</svg>\n'
    )

    path = os.path.join(OUT_DIR, f"{stem}.svg")
    with open(path, "w", encoding="utf-8") as f:
        f.write(svg)
    print(f"    SVG           {cw}×{ch}  →  {os.path.basename(path)}")


# ── main ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    cd  = crop_alpha(CD_SRC)
    wmb = crop_alpha(WM_BLACK)
    wmw = crop_alpha(WM_WHITE)

    # CD reference height = full wordmark canvas height (natural padding included).
    # This is ~1.87× the cap height, giving the disc visual weight equal to the text.
    cd_ref_h = Image.open(WM_BLACK).height   # 1000 px

    print(f"CD source     {cd.size}")
    print(f"Wordmark      {wmb.size}  (black = white, identical crop)")
    print(f"CD ref height {cd_ref_h} px  (full WM canvas, ~1.87× cap height)")
    print()

    jobs = [
        ("horizontal", "black", build_horizontal, wmb),
        ("horizontal", "white", build_horizontal, wmw),
        ("vertical",   "black", build_vertical,   wmb),
        ("vertical",   "white", build_vertical,   wmw),
    ]

    for orientation, colour, builder, wm in jobs:
        stem   = f"weebtrax-logo-{orientation}-{colour}"
        canvas, positions = builder(cd, wm, cd_ref_h)
        cw, ch = positions["canvas"]
        print(f"  [{orientation} / {colour}]  master canvas {cw}×{ch}")
        export_pngs(canvas, stem)
        export_svg(cd, wm, positions, stem)
        print()

    print("Done.")
