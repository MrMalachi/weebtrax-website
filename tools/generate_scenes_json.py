import json, re

def slugify(s):
    s = s.lower()
    s = re.sub(r'[^a-z0-9\s-]', ' ', s)
    s = re.sub(r'\s+', '-', s.strip())
    return re.sub(r'-+', '-', s).strip('-')

def start_time_from_old_slug(old_slug):
    m = re.search(r't(\d+)s', old_slug)
    if not m:
        return None
    secs = int(m.group(1))
    h, rem = divmod(secs, 3600)
    mins, s = divmod(rem, 60)
    return f"{h:02d}:{mins:02d}:{s:02d}"

def ep_num(slug):
    m = re.match(r'episode-(\d+)', slug)
    return int(m.group(1)) if m else None

# Mapping from old timestamp-based slug to new sequential slug
RENAME_MAP = {
    "episode-01_clip_t0010s": "episode-01_clip-01",
    "episode-01_clip_t0050s": "episode-01_clip-02",
    "episode-01_clip_t0060s": "episode-01_clip-03",
    "episode-01_clip_t0130s": "episode-01_clip-04",
    "episode-01_clip_t0150s": "episode-01_clip-05",
    "episode-01_clip_t0180s": "episode-01_clip-06",
    "episode-01_clip_t0200s": "episode-01_clip-07",
    "episode-01_clip_t0530s": "episode-01_clip-08",
    "episode-01_clip_t0540s": "episode-01_clip-09",
    "episode-01_clip_t0680s": "episode-01_clip-10",
    "episode-01_clip_t0720s": "episode-01_clip-11",
    "episode-01_clip_t0760s": "episode-01_clip-12",
    "episode-01_clip_t0760sseg2": "episode-01_clip-13",
    "episode-01_clip_t0790s": "episode-01_clip-14",
    "episode-01_clip_t0860s": "episode-01_clip-15",
    "episode-01_clip_t0860sseg2": "episode-01_clip-16",
    "episode-01_clip_t0880s": "episode-01_clip-17",
    "episode-01_clip_t1150s": "episode-01_clip-18",
    "episode-02_clip_t1010s": "episode-02_clip-01",
    "episode-02_clip_t1050s": "episode-02_clip-02",
    "episode-02_clip_t1050sseg2": "episode-02_clip-03",
    "episode-02_clip_t1050sseg3": "episode-02_clip-04",
    "episode-02_clip_t1060s": "episode-02_clip-05",
    "episode-02_clip_t1060sseg2": "episode-02_clip-06",
    "episode-02_clip_t1060sseg3": "episode-02_clip-07",
    "episode-03_clip_t0810s": "episode-03_clip-01",
    "episode-03_clip_t0810sseg2": "episode-03_clip-02",
    "episode-03_clip_t0860s": "episode-03_clip-03",
    "episode-03_clip_t0860sseg2": "episode-03_clip-04",
    "episode-03_clip_t0860sseg3": "episode-03_clip-05",
    "episode-04_clip_t0600s": "episode-04_clip-01",
    "episode-04_clip_t0610s": "episode-04_clip-02",
    "episode-04_clip_t0680s": "episode-04_clip-03",
    "episode-04_clip_t0730s": "episode-04_clip-04",
    "episode-05_clip_t0200s": "episode-05_clip-01",
    "episode-05_clip_t0660s": "episode-05_clip-02",
    "episode-05_clip_t0670s": "episode-05_clip-03",
    "episode-06_clip_t0610s": "episode-06_clip-01",
    "episode-06_clip_t0800s": "episode-06_clip-02",
    "episode-06_clip_t0820s": "episode-06_clip-03",
    "episode-07_clip_t0410s": "episode-07_clip-01",
    "episode-08_clip_t0150s": "episode-08_clip-01",
    "episode-10_clip_t0820s": "episode-10_clip-01",
    "episode-11_clip_t1050s": "episode-11_clip-01",
    "episode-11_clip_t1160s": "episode-11_clip-02",
    "episode-12_clip_t0670s": "episode-12_clip-01",
    "episode-13_clip_t0660s": "episode-13_clip-01",
    "episode-13_clip_t0720s": "episode-13_clip-02",
}

# Each scene: (slug, name, type, description, mood)
SCENES = [
    # Episode 01
    ("episode-01_clip_t0010s",
     "Ghost in the Static",
     "DEEP TRANSMISSION",
     "A phantom shape drifts through deep blue static, the signal barely holding its form.",
     "deep"),

    ("episode-01_clip_t0050s",
     "Screen Reflection",
     "CRT GHOST",
     "An eye stares back from behind scan lines, the boundary between viewer and signal dissolving.",
     "deep"),

    ("episode-01_clip_t0060s",
     "Morning Dissolve",
     "GREY SIGNAL",
     "A figure fades into white mist, the world half-rendered and retreating.",
     "chill"),

    ("episode-01_clip_t0130s",
     "Crowd Frequency",
     "MASS SIGNAL",
     "A sea of faces lit by overhead fluorescents, the city processing its daily load.",
     "chill"),

    ("episode-01_clip_t0150s",
     "Boot Sequence",
     "SYSTEM INIT",
     "The series title burns through blue static, the terminal waking.",
     "deep"),

    ("episode-01_clip_t0180s",
     "Kanji Drift",
     "DATA BLOOM",
     "Japanese characters float through a pastel dreamfield, meaning dissolving into color.",
     "chill"),

    ("episode-01_clip_t0200s",
     "Wire Overhead",
     "URBAN GRID",
     "Looking up through a tangle of cables into blown-out sky, the city's nervous system exposed.",
     "deep"),

    ("episode-01_clip_t0530s",
     "Wide Aperture",
     "CLOSE SIGNAL",
     "Two eyes, wide and unblinking, absorbing the frame in full.",
     "nostalgic"),

    ("episode-01_clip_t0540s",
     "Signal Block",
     "INTERRUPT",
     "A hand pressed toward the lens, caught between reaching out and blocking transmission.",
     "dirty"),

    ("episode-01_clip_t0680s",
     "Identity Prompt",
     "LOGIN TERMINAL",
     "The NAVI awaits identification, cursor blinking in patient silence.",
     "deep"),

    ("episode-01_clip_t0720s",
     "NAVI Interface",
     "NAVI GLOW",
     "A handwritten name traced in blue light across the monitor surface.",
     "deep"),

    ("episode-01_clip_t0760s",
     "Deep Stare",
     "SHADOW FEED",
     "Eyes half-lit in shadow, watching from somewhere just outside the frame.",
     "deep"),

    ("episode-01_clip_t0760sseg2",
     "Lain's Bedroom",
     "BEDROOM STATIC",
     "Soft light pooling across an unmade bed, the room waiting in perfect silence.",
     "chill"),

    ("episode-01_clip_t0790s",
     "Overexposed",
     "RED SIGNAL",
     "Eyes caught in red light, pupils blown out like corrupted data.",
     "dirty"),

    ("episode-01_clip_t0860s",
     "Red NAVI",
     "HARDWARE GLOW",
     "A red-cased machine pulses in the dark, the only light source in the room.",
     "deep"),

    ("episode-01_clip_t0860sseg2",
     "Night Session",
     "BEDROOM TERMINAL",
     "A figure hunched toward a glowing screen, the room consumed in deep blue.",
     "deep"),

    ("episode-01_clip_t0880s",
     "Lain's Gaze",
     "SOFT STATIC",
     "Dark eyes catching a fragment of light, open and quietly absorbing everything.",
     "nostalgic"),

    ("episode-01_clip_t1150s",
     "Lamp in the Mist",
     "SIGNAL DRIFT",
     "A street lamp suspended in grey fog, the signal bleeding at the edges of the frame.",
     "deep"),

    # Episode 02
    ("episode-02_clip_t1010s",
     "Terminal Approach",
     "NAVI ACCESS",
     "A figure stands before a glowing console, back turned, connection pending.",
     "deep"),

    ("episode-02_clip_t1050s",
     "Idle State",
     "SCREENSAVER",
     "A blue ring orbits endlessly on the screensaver, the machine left dreaming.",
     "chill"),

    ("episode-02_clip_t1050sseg2",
     "Pastel Overflow",
     "DATA BLOOM",
     "Characters dissolve into watercolor noise, language collapsing into pattern.",
     "chill"),

    ("episode-02_clip_t1050sseg3",
     "Hallway Exchange",
     "CORRIDOR SIGNAL",
     "Two figures in a school corridor, their conversation absorbed by ambient noise.",
     "nostalgic"),

    ("episode-02_clip_t1060s",
     "Neon Bleed",
     "CITY STATIC",
     "Signs bleed into each other in the rain, the city rendered as pure color and noise.",
     "dirty"),

    ("episode-02_clip_t1060sseg2",
     "Bubble Signal",
     "SOFT FRAGMENT",
     "A face emerging from a field of soft blue orbs, barely resolved.",
     "chill"),

    ("episode-02_clip_t1060sseg3",
     "Cyberia Sign",
     "NEON PORTAL",
     "Blue neon glows against a dark wall, the club entrance flickering in silence.",
     "deep"),

    # Episode 03
    ("episode-03_clip_t0810s",
     "Broadcast Flash",
     "SIGNAL BURST",
     "A column of white light cuts through darkness, the transmission forced through.",
     "dirty"),

    ("episode-03_clip_t0810sseg2",
     "Shelf Sentinels",
     "BEDROOM STATIC",
     "Plush toys stare from the shelf, small sentinels of an analog childhood.",
     "chill"),

    ("episode-03_clip_t0860s",
     "Signal Spiral",
     "FEED CORRUPT",
     "A fractal vortex unravels in corrupted color, the feed degrading into abstraction.",
     "dirty"),

    ("episode-03_clip_t0860sseg2",
     "Foreign Signal",
     "ALIEN FEED",
     "A non-human eye blinks in blue light, watching from outside the network.",
     "deep"),

    ("episode-03_clip_t0860sseg3",
     "Wired Pulse",
     "DATA RINGS",
     "Blue interference rings ripple outward, a pulse broadcast into open space.",
     "deep"),

    # Episode 04
    ("episode-04_clip_t0600s",
     "Monitor Array",
     "COMMAND CENTER",
     "Lain at the center of a ring of glowing screens, the room becoming the network.",
     "deep"),

    ("episode-04_clip_t0610s",
     "Pale Stare",
     "DEEP STATIC",
     "A face drained of color, eyes carrying more weight than they should.",
     "nostalgic"),

    ("episode-04_clip_t0680s",
     "Night Broadcast",
     "NIGHT SKY",
     "A bruised sky hanging low over dark silhouettes, the city breathing slowly beneath.",
     "deep"),

    ("episode-04_clip_t0730s",
     "Upward Gaze",
     "PALE SIGNAL",
     "A face washed in pale light, eyes lifted toward something not yet visible.",
     "nostalgic"),

    # Episode 05
    ("episode-05_clip_t0200s",
     "Packed Train",
     "COMMUTER GRID",
     "The car pressed full of bodies, each one absorbing signal with nowhere to transmit.",
     "chill"),

    ("episode-05_clip_t0660s",
     "Copland OS",
     "SYSTEM BOOT",
     "The operating system initializes, a blue targeting reticle locking into place.",
     "deep"),

    ("episode-05_clip_t0670s",
     "Scan Line Eyes",
     "FEED ARTIFACT",
     "Eyes crossed with horizontal scan lines, the self rendered as video artifact.",
     "dirty"),

    # Episode 06
    ("episode-06_clip_t0610s",
     "Server Room",
     "MAINFRAME",
     "A figure stands before a tower of servers, the physical backbone of the Wired exposed.",
     "deep"),

    ("episode-06_clip_t0800s",
     "Burnt Horizon",
     "DEAD SIGNAL",
     "An orange sky burns down over a silent landscape, the world after something has ended.",
     "nostalgic"),

    ("episode-06_clip_t0820s",
     "Iris Lock",
     "IRIS SCAN",
     "A single amber eye fills the frame, intricate and unreadable, the gaze turned inward.",
     "deep"),

    # Episode 07
    ("episode-07_clip_t0410s",
     "Suburban Grid",
     "GRID EXTERIOR",
     "A quiet residential street, the ordinary world humming beneath its surface.",
     "chill"),

    # Episode 08
    ("episode-08_clip_t0150s",
     "System Restart",
     "BOOT SEQUENCE",
     "The series name burned into blue static, the terminal restarting from the beginning.",
     "deep"),

    # Episode 10
    ("episode-10_clip_t0820s",
     "Perception Glitch",
     "VISUAL CORRUPT",
     "Vision itself corrupted, the eyes no longer reporting what is actually there.",
     "dirty"),

    # Episode 11
    ("episode-11_clip_t1050s",
     "Doorway Watch",
     "LIMINAL FEED",
     "A figure watching from behind a half-open door, the threshold between spaces uncertain.",
     "nostalgic"),

    ("episode-11_clip_t1160s",
     "Grey Signal",
     "COLD STATIC",
     "Pale eyes shot through with grey, the emotion behind them impossible to read.",
     "deep"),

    # Episode 12
    ("episode-12_clip_t0670s",
     "Empty Tunnel",
     "CORRIDOR",
     "A dark passage lit by a line of ceiling lights, the path extending into silence.",
     "deep"),

    # Episode 13
    ("episode-13_clip_t0660s",
     "Iron Skeleton",
     "MACHINE FEED",
     "The bones of a machine stripped against a bleached sky, function reduced to form.",
     "deep"),

    ("episode-13_clip_t0720s",
     "Neon Gate",
     "TRANSMISSION",
     "A hot pink frame surrounding a field of amber light, the threshold between real and wired.",
     "dirty"),
]

scenes = []
for i, (old_slug, name, scene_type, description, mood) in enumerate(SCENES, 1):
    new_slug = RENAME_MAP[old_slug]
    scenes.append({
        "id": f"scene-{i:03d}",
        "name": name,
        "slug": slugify(name),
        "type": scene_type,
        "description": description,
        "episodeNumber": ep_num(old_slug),
        "mood": mood,
        "videoPath": f"public/assets/scenes/videos/{new_slug}.mp4",
        "thumbnailPath": f"public/assets/scenes/thumbnails/{new_slug}.jpg",
    })

out = "public/assets/metadata/scenes.json"
with open(out, "w") as f:
    json.dump(scenes, f, indent=2, ensure_ascii=False)

print(f"Wrote {len(scenes)} scenes to {out}")
