"""
Generate WeebTrax Linktree thumbnail (1200×630).
Layout mirrors the actual hero section exactly:
  top-left : wired://weebtrax/connect — status: ONLINE
  top-right: ⌁ 44.1kHz
  bottom-left stack (anchored to bottom:52, left:40):
    ▌ MODULE .00  // HOME
    [LO-FI HOUSE]  transmitting from the wired
    WeebTrax  (Love Letter TW 132 px)
    Low-Fidelity House mixes
    from Cyberia Café & Club.
    [▸ Listen to the Latest Mix]  [Submit Your Track]
"""
from PIL import Image, ImageDraw, ImageFont
import numpy as np
import os

BASE = os.path.dirname(os.path.abspath(__file__))

W, H = 1200, 630

# design tokens
BG      = (10, 11, 14)
GREEN   = (143, 191, 159)
INK     = (230, 225, 212)         # WT2.ink
BODY    = (230, 225, 212, 219)    # WT2.body  rgba @ 0.86 → 219/255
DIM     = (230, 225, 212, 163)    # WT2.dim   rgba @ 0.64
FAINT   = (230, 225, 212, 112)    # WT2.faint rgba @ 0.44
LINE    = (214, 209, 198, 51)     # WT2.line  rgba @ 0.20
LINE2   = (214, 209, 198, 97)     # WT2.line2 rgba @ 0.38
RED_ACC = (196, 115, 135)

# -----------------------------------------------------------------------
# 1.  Base canvas
# -----------------------------------------------------------------------
img = Image.new('RGBA', (W, H), (*BG, 255))

# -----------------------------------------------------------------------
# 2.  Lain background photo  (1920×1080 → scale to fit H, right-align)
# -----------------------------------------------------------------------
photo = Image.open(f'{BASE}/public/assets/images/43047_serial_experiments_lain.jpg').convert('RGBA')
ph_w, ph_h = photo.size          # 1920 × 1080
scale  = H / ph_h                # ≈ 0.583
new_w  = int(ph_w * scale)       # ≈ 1120  (< 1200)
photo  = photo.resize((new_w, H), Image.LANCZOS)

photo_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
x_off = W - new_w                # right-align; positive → gap on left filled by BG
photo_layer.paste(photo, (x_off, 0))
img = Image.alpha_composite(img, photo_layer)

# -----------------------------------------------------------------------
# 3.  Gradient overlays
# -----------------------------------------------------------------------
xs = np.arange(W, dtype=np.float32) / W
ys = np.arange(H, dtype=np.float32) / H

# left dark fade
left_a = np.zeros(W, dtype=np.float32)
m1 = xs <= 0.40;  left_a[m1] = 235 - (235-153)*(xs[m1]/0.40)
m2 = (xs>0.40)&(xs<=0.62); left_a[m2] = 153 - (153-31)*((xs[m2]-0.40)/0.22)
m3 = (xs>0.62)&(xs<=0.80); left_a[m3] = 31*(1-(xs[m3]-0.62)/0.18)
left_a = np.clip(left_a, 0, 255)
ll = np.zeros((H,W,4), dtype=np.uint8)
ll[:,:,0]=BG[0]; ll[:,:,1]=BG[1]; ll[:,:,2]=BG[2]
ll[:,:,3] = left_a.astype(np.uint8)
img = Image.alpha_composite(img, Image.fromarray(ll,'RGBA'))

# top + bottom dark fade
bot_a = np.zeros(H, dtype=np.float32)
b1=ys<=0.22;  bot_a[b1] = 128*(1-ys[b1]/0.22)
b2=(ys>0.22)&(ys<=0.55); bot_a[b2] = 13*((ys[b2]-0.22)/(0.55-0.22))
b3=ys>0.55;   bot_a[b3] = 13+(204-13)*((ys[b3]-0.55)/(1.0-0.55))
bot_a = np.clip(bot_a, 0, 255)
bl = np.zeros((H,W,4), dtype=np.uint8)
bl[:,:,0]=BG[0]; bl[:,:,1]=BG[1]; bl[:,:,2]=BG[2]
bl[:,:,3] = np.tile(bot_a.reshape(-1,1),(1,W)).astype(np.uint8)
img = Image.alpha_composite(img, Image.fromarray(bl,'RGBA'))

# pink radial glow (Lain's warm aura)
Yg,Xg = np.mgrid[0:H, 0:W]
cx,cy  = int(0.80*W), int(0.52*H)
rx,ry  = int(0.30*W), int(0.42*H)
dist   = np.sqrt(((Xg-cx)/rx)**2 + ((Yg-cy)/ry)**2)
pa     = np.clip((1.0-dist/0.72)*33, 0, 33).astype(np.uint8)
pl     = np.zeros((H,W,4), dtype=np.uint8)
pl[:,:,0]=RED_ACC[0]; pl[:,:,1]=RED_ACC[1]; pl[:,:,2]=RED_ACC[2]; pl[:,:,3]=pa
img = Image.alpha_composite(img, Image.fromarray(pl,'RGBA'))

# -----------------------------------------------------------------------
# 4.  Scanlines
# -----------------------------------------------------------------------
sl = np.zeros((H,W,4), dtype=np.uint8)
sl[::3,:,3] = 18
img = Image.alpha_composite(img, Image.fromarray(sl,'RGBA'))

# -----------------------------------------------------------------------
# 5.  Corner ticks  (FrameTicks: inset=22, len=26, color=WT2.line2)
# -----------------------------------------------------------------------
INSET, LEN, TW = 22, 26, 2
tl = Image.new('RGBA', (W,H), (0,0,0,0))
td = ImageDraw.Draw(tl)
TC = (*LINE2[:3], 97)
td.line([(INSET, INSET+LEN),(INSET,INSET),(INSET+LEN,INSET)],       fill=TC, width=TW)
td.line([(W-INSET-LEN,INSET),(W-INSET,INSET),(W-INSET,INSET+LEN)], fill=TC, width=TW)
td.line([(INSET,H-INSET-LEN),(INSET,H-INSET),(INSET+LEN,H-INSET)], fill=TC, width=TW)
td.line([(W-INSET-LEN,H-INSET),(W-INSET,H-INSET),(W-INSET,H-INSET-LEN)], fill=TC, width=TW)
img = Image.alpha_composite(img, tl)

# -----------------------------------------------------------------------
# 6.  Fonts
# -----------------------------------------------------------------------
MONO = '/System/Library/Fonts/Menlo.ttc'
def mf(size):
    return ImageFont.truetype(MONO, size)

f_top  = mf(15)   # top-bar tiny text
f_ui   = mf(15)   # breadcrumb / tag / subtitle
f_para = mf(19)   # paragraph body
try:
    f_wm = ImageFont.truetype(f'{BASE}/public/assets/fonts/loveletter.ttf', 130)
except Exception:
    f_wm = mf(100)

# -----------------------------------------------------------------------
# 7.  Text — draw on a working RGBA canvas so we can do alpha text
# -----------------------------------------------------------------------
draw = ImageDraw.Draw(img)

PL = 40    # left: 40 (same as site)
PB = 52    # bottom: 52

# helper — draw coloured text, returns right-edge x
def txt(x, y, s, font, color):
    draw.text((x, y), s, font=font, fill=color)
    return x + draw.textlength(s, font=font)

# ── measure element heights from font metrics ──────────────────────────
def th(s, font):
    bb = draw.textbbox((0,0), s, font=font)
    return bb[3] - bb[1]

wm_h        = th('WeebTrax', f_wm)
para_lh     = th('Low-Fidelity House mixes', f_para)  # single line height
para_spacing= int(para_lh * 1.6)
btn_lh      = th('▸ Listen to the Latest Mix', f_ui)
tag_lh      = th('LO-FI HOUSE', f_ui)
tag_pad_v   = 5   # top/bottom padding inside tag box
tag_total_h = tag_lh + tag_pad_v * 2
bc_h        = th('▌ MODULE .00', f_ui)
sub_h       = th('transmitting from the wired', f_ui)

# ── build stack bottom-up ──────────────────────────────────────────────
y_bot = H - PB   # baseline anchor

# --- buttons (flex row, gap 14px) ---
# buttons: site uses uppercase + letterSpacing, primary=green bg/dark text, ghost=green border/text
btn1_text = '▶  LISTEN TO THE LATEST MIX'
btn2_text = 'SUBMIT YOUR TRACK'
btn_py = 11   # vertical padding (site: 13px)
btn_px = 18   # horizontal padding (site: 20px)
btn_h_total = btn_lh + btn_py * 2
btn_y = y_bot - btn_h_total

btn1_w = int(draw.textlength(btn1_text, font=f_ui)) + btn_px * 2
btn2_w = int(draw.textlength(btn2_text, font=f_ui)) + btn_px * 2
# primary button: solid green fill, dark void text
draw.rectangle([PL, btn_y, PL + btn1_w, btn_y + btn_h_total],
               fill=(*GREEN, 255), outline=(*GREEN, 255), width=1)
draw.text((PL + btn_px, btn_y + btn_py), btn1_text, font=f_ui, fill=(*BG, 255))
# ghost button: transparent fill, green border + text
x2 = PL + btn1_w + 14
draw.rectangle([x2, btn_y, x2 + btn2_w, btn_y + btn_h_total],
               fill=(0,0,0,0), outline=(*GREEN, 180), width=1)
draw.text((x2 + btn_px, btn_y + btn_py), btn2_text, font=f_ui, fill=(*GREEN, 200))

# --- paragraph: margin 18px above, 28px below (to buttons) ---
para_bot    = btn_y - 28
para_line2_y= para_bot - para_lh
para_line1_y= para_line2_y - para_spacing
draw.text((PL, para_line1_y), 'Low-Fidelity House mixes', font=f_para, fill=(*INK, 220))
draw.text((PL, para_line2_y), 'from Cyberia Café & Club.', font=f_para, fill=(*INK, 220))

# --- wordmark: margin 18px above paragraph (top margin) ---
wm_bot = para_line1_y - 18
wm_y   = wm_bot - wm_h
draw.text((PL, wm_y), 'WeebTrax', font=f_wm, fill=(*INK, 255))

# --- tag row: marginBottom 18px from wordmark ---
tag_row_bot = wm_y - 18
# vertically center tag and subtitle on same row
row_h       = max(tag_total_h, sub_h)
row_y       = tag_row_bot - row_h

# Tag chip: [LO-FI HOUSE] — border = WT2.line2, text = green
tag_pad_h = 8
tag_w = int(draw.textlength('LO-FI HOUSE', font=f_ui)) + tag_pad_h * 2
tag_box_y = row_y + (row_h - tag_total_h) // 2
draw.rectangle([PL, tag_box_y, PL + tag_w, tag_box_y + tag_total_h],
               fill=(0,0,0,0), outline=(*INK, 51), width=1)
draw.text((PL + tag_pad_h, tag_box_y + tag_pad_v), 'LO-FI HOUSE',
          font=f_ui, fill=(*GREEN, 220))

# Subtitle inline with tag
sub_x = PL + tag_w + 12
sub_y = row_y + (row_h - sub_h) // 2
draw.text((sub_x, sub_y), 'transmitting from the wired', font=f_ui, fill=(*INK, 163))

# --- breadcrumb: marginBottom 12px from tag row ---
bc_y = row_y - 12 - bc_h
x = PL
x = txt(x, bc_y, '▌ ', f_ui, (*GREEN, 200))
x = txt(x, bc_y, 'MODULE .00', f_ui, (*GREEN, 200))
x = txt(x, bc_y, '  ', f_ui, (*INK, 0))   # gap
txt(x, bc_y, '// HOME', f_ui, (*INK, 112))

# ── top bar (site: top:32, left/right:36) ─────────────────────────────
TB_Y = 32
TB_L = 36

prefix = 'wired://weebtrax/connect  —  status: '
end_x  = TB_L + draw.textlength(prefix, font=f_top)
draw.text((TB_L, TB_Y), prefix, font=f_top, fill=(*INK, 160))
txt(end_x, TB_Y, 'ONLINE', f_top, (*GREEN, 240))

tr_text = '⌁ 44.1kHz'
tr_w    = draw.textlength(tr_text, font=f_top)
draw.text((W - 36 - tr_w, TB_Y), tr_text, font=f_top, fill=(*INK, 100))

# -----------------------------------------------------------------------
# 8.  Save
# -----------------------------------------------------------------------
out = img.convert('RGB')
out_path = f'{BASE}/public/assets/images/thumbnail.png'
out.save(out_path, optimize=True)
print(f'Saved: {out_path}  ({W}x{H})')
