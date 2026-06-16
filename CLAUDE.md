# WeebTrax — Project Roadmap

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | Local media organization | ✅ Complete |
| 2 | JSON metadata | ✅ Complete |
| 3 | Website reads JSON | ✅ Complete |
| 4 | Create backend / API (FastAPI) | ⬜ Not started |
| 5 | Move JSON metadata into PostgreSQL | ⬜ Not started |
| 6 | Deploy with Railway | ⬜ Not started |
| 7 | Move large media to storage bucket (Cloudflare R2) | ⬜ Not started |

---

## Phase 1 — Local media organization

Target folder structure:
```
public/assets/
  mixes/
    audio/          ← .mp3 files, slugified names
    thumbnails/     ← matching .jpg per mix
  scenes/
    videos/         ← .mp4 clips, slugified names
    thumbnails/     ← matching .jpg per scene
  metadata/
    mixes.json
    scenes.json
```

### Notes
- Mix thumbnails live in `public/assets/scenes/thumbnails/` — user-selectable, not assigned per mix
- 94 mixes converted from `.mp4` → `.mp3` and copied to `public/assets/mixes/audio/`
- 48 scene clips across episodes 1–13, named `episode-XX_clip-NN.mp4` (sequential per episode)

### Checklist
- [x] Slugify MP3 filenames on flash drive (Mixes folders)
- [x] Slugify WAV filenames in Mastered folder
- [x] Organize mix audio files into `public/assets/mixes/audio/`
- [x] Organize mix thumbnails into `public/assets/scenes/thumbnails/` (user-selectable)
- [x] Organize scene MP4 clips into `public/assets/scenes/videos/`
- [x] Organize scene thumbnails into `public/assets/scenes/thumbnails/`

---

## Phase 2 — JSON metadata

Create:
- `public/assets/metadata/mixes.json` ✅ Generated (94 entries)
- `public/assets/metadata/scenes.json` ✅ Generated (48 entries)

### mixes.json fields (finalised)
`id`, `title`, `slug`, `duration`, `releaseDate`, `mood`, `views`, `audioPath`, `youtubeUrl`, `soundcloudUrl`

- 72/94 have SoundCloud URLs; 22 early mixes are YouTube-only (null)
- `mood` is one of: `chill`, `nostalgic`, `dirty`, `deep`
- `views` = YouTube view count snapshot; becomes live in Phase 4/5 via scheduled yt-dlp refresh against PostgreSQL
- No `artist`, `tags`, or `thumbnailPath` — not needed for the site

### scenes.json fields (finalised)
`id`, `name`, `slug`, `type`, `description`, `episodeNumber`, `mood`, `videoPath`, `thumbnailPath`

- 48 scenes across episodes 1–13
- `type` is the badge chip shown on the card (e.g. "CLUB TERMINAL", "BEDROOM STATIC")
- `description` is 1–2 sentences of evocative prose per scene
- `episodeNumber` kept for future episode-based filtering
- No `startTime`, `endTime`, `duration`, or `tags` — not needed on the frontend
- No `plays` yet — scene popularity requires Phase 4/5 (PostgreSQL tracks selections)

---

## Phase 3 — Website reads JSON

Frontend dynamically loads `mixes.json` and `scenes.json` instead of hardcoded HTML.
Generates: archive rows, scene cards, thumbnails, play buttons, YT/SC links, mood tags.

### What was done
- Unbundled the Claude Artifact `index.html` into separate files: `js/react.js`, `js/react-dom.js`, `js/images.js`, `js/tweaks-panel.js`, `js/core.js`, `js/sections1.js`, `js/sections2.js`, `js/app.js`, `css/styles.css`
- `app.js` pre-fetches both JSONs via `Promise.all([fetch(...), fetch(...)])` before mounting React, storing results in `window.__WT_MIXES` and `window.__WT_SCENES`
- `sections2.js` — `getMixes()` transforms `window.__WT_MIXES` entries into the shape the Archive components expect; replaces the old hardcoded 5-item `TX` array. All 94 mixes now render.
- `sections1.js` — `SceneGrid` reads `window.__WT_SCENES` and maps `type→tag`, `description→desc`, `thumbnailPath→img`. All 48 scenes now render with real thumbnails.
- Mood→accent color mapping: `chill→blue`, `nostalgic→purple`, `dirty→red`, `deep→green`
- Serve with: `python3 -m http.server 3000` from the project root

### Checklist
- [x] Unbundle app into plain separate JS/CSS files
- [x] Fetch and parse mixes.json at page load
- [x] Fetch and parse scenes.json at page load
- [x] Archive section renders all 94 mixes from JSON
- [x] Scenes section renders all 48 scenes from JSON with real thumbnails
- [x] Mood tags drive accent color per archive row
- [x] Null soundcloudUrl handled gracefully (shows YOUTUBE platform badge)

---

## Phase 4 — Backend / API

FastAPI backend with endpoints:
- `GET /api/mixes`
- `GET /api/mixes/latest`
- `GET /api/scenes`
- `GET /api/scenes?page=1`
- `GET /api/scenes?tag=rainy`

Can still read from JSON initially, then swap to PostgreSQL.

---

## Phase 5 — PostgreSQL

JSON fields become table columns. DB stores metadata + file paths only (not files themselves).

---

## Phase 6 — Deploy with Railway

- Frontend → Cloudflare Pages
- Backend/API → Railway
- Database → PostgreSQL on Railway

---

## Phase 7 — Media storage bucket (if needed)

Move large files from repo to Cloudflare R2. DB paths change from `/assets/...` to `https://media.weebtrax.com/...`.
