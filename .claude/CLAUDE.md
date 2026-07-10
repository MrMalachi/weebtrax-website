# WeebTrax — Project Roadmap

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | Local media organization | ✅ Complete |
| 2 | JSON metadata | ✅ Complete |
| 3 | Website reads JSON | ✅ Complete |
| 3.5 | Countdown page (pre-launch holding page) | ✅ Live — remove before full launch |
| 4 | Create backend / API (FastAPI) | 🟨 In progress — `backend/` scaffolded, reads from JSON |
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
`id`, `title`, `slug`, `duration`, `releaseDate`, `mood`, `views`, `audioPath`, `youtubeUrl`, `soundcloudUrl`, `tracklist`

- 72/94 have SoundCloud URLs; 22 early mixes are YouTube-only (null)
- `mood` is one of: `chill`, `nostalgic`, `dirty`, `deep`
- `views` = YouTube view count snapshot; becomes live in Phase 4/5 via scheduled yt-dlp refresh against PostgreSQL
- `tracklist` = array of `{ timeSecs, title, artist? }` entries; 92/94 populated via yt-dlp from YouTube descriptions
- No `artist`, `tags`, or `thumbnailPath` — not needed for the site

### scenes.json fields (finalised)
`id`, `name`, `slug`, `type`, `description`, `episodeNumber`, `mood`, `videoPath`, `thumbnailPath`

- 48 scenes across episodes 1–13 (episode 9 has no footage — omitted intentionally)
- `type` is the badge chip shown on the card (e.g. "CLUB TERMINAL", "BEDROOM STATIC")
- `description` is 1–2 sentences of evocative prose per scene
- `episodeNumber` drives the episode filter in the Scenes section
- No `startTime`, `endTime`, `duration`, or `tags` — not needed on the frontend
- No `plays` yet — scene popularity requires Phase 4/5 (PostgreSQL tracks selections)

---

## Phase 3 — Website reads JSON

Frontend dynamically loads `mixes.json` and `scenes.json` instead of hardcoded HTML.
Generates: archive rows, scene cards, thumbnails, play buttons, YT/SC links, mood tags.

### What was done
- Unbundled the Claude Artifact `index.html` into separate files: `js/react.js`, `js/react-dom.js`, `js/images.js`, `js/tweaks-panel.js`, `js/core.js`, `js/sections1.js`, `js/sections2.js`, `js/app.js`, `css/styles.css`
- `app.js` pre-fetches both JSONs via `Promise.all([fetch(...), fetch(...)])` before mounting React, storing results in `window.__WT_MIXES` and `window.__WT_SCENES`
- `sections2.js` — `getMixes()` transforms `window.__WT_MIXES` entries; all 94 mixes render with mood filter, sort, and pagination
- `sections1.js` — `SceneGrid` renders all 48 scenes with episode filter, scene player, and pagination
- Mood→accent color mapping: `chill→blue`, `nostalgic→purple`, `dirty→red`, `deep→green`
- Serve with: `python3 -m http.server 3000` from the project root

### Current features (as of 2026-06-19)
- **Archive**: 94 mixes, mood filter chips (right-aligned, above player), NEWEST/OLDEST/A-Z sort, 5-per-page pagination, active row player
- **Archive status line**: shows filtered file count only (e.g. `094 files`), not a fraction
- **Playback**: auto-advance to next track, keyboard shortcuts (Space/←/→), session restore via localStorage. Spacebar routes through `togglePlayRef` to avoid stale closure.
- **Audio fades**: 200ms fade-in via GainNode on all play paths; 15ms fade-out on pause to prevent click without causing position skip
- **Waveform**: Web Audio API AnalyserNode (`window.__WT_ANALYSER`) drives both oscilloscopes reactively; `window.__WT_ANALYSER` set on first play
- **Broadcast bar**: in `js/app.js` (`BroadcastBar` component, ~line 73) — NOT the `Ticker` component in `core.js` (that is dead/unused code). Separator is `·` (middle dot `\xB7`), rendered as a separate span at `fontSize: 15` inside a `loopedItems` array. Items and separators rendered as React elements (not a joined string) to allow independent sizing.
- **Scenes**: 48 scenes, episode filter (EP 01–13, no EP 09 footage), 6-per-page pagination; grid uses `repeat(auto-fill, minmax(300px, 1fr))` for responsive card sizing
- **Scene player** (`SignalFeed`): Wired/Navi aesthetic — `WIRED://NODE.227` header, click-to-toggle video, flash icon, fullscreen mode (scroll-locked), mobile responsive (<600px); corner labels (`NODE.227`, `EP.XX`, timecode) offset `22/26px` from edges for breathing room from `FrameTicks` brackets
- **Hero text bar**: repositioned to `top: 32, left/right: 36` to match video player corner offset ratio (`inset: 22` + 10/14px breathing room)
- **Rail WT logo**: hover state — accent border glow, corner ticks expand 6→9px, WT text bloom, `// WEEBTRAX` label slides in to the right; click scrolls to top
- **About section**: "FROM CLUB CYBERIA"; footer bar reads "LET THERE BE HOUSE" (was "STATUS: ONLINE"); subtitle "Producers — transmit your signal into The Wired"
- **Visibility**: `WT2` text opacity raised — `body` 0.72→0.86, `dim` 0.5→0.64, `faint` 0.3→0.44; `line` 0.14→0.20, `line2` 0.28→0.38
- **Error boundary**: wraps `<App>`, crashes show a readable message instead of blank screen
- **Deleted**: `js/utils.js`, `js/main.js`, `src/` directories, dead `FeatureModule` component

### Checklist
- [x] Unbundle app into plain separate JS/CSS files
- [x] Fetch and parse mixes.json at page load
- [x] Fetch and parse scenes.json at page load
- [x] Archive section renders all 94 mixes from JSON
- [x] Scenes section renders all 48 scenes from JSON with real thumbnails
- [x] Mood tags drive accent color per archive row
- [x] Null soundcloudUrl handled gracefully (shows YOUTUBE platform badge)
- [x] Tracklists populated for 92/94 mixes from YouTube descriptions
- [x] Episode filter, mood filter, sort, pagination all wired up
- [x] Scene video player redesigned (Wired/Navi aesthetic, fullscreen, mobile)

---

## Phase 3 — Remaining improvements (TODO)

### Playback
- [ ] Previous track button — auto-advance goes forward but no way to go back
- [ ] Shuffle mode — random track selection
- [ ] Show tracklist in the active player card (data exists for 92/94 mixes, currently only shown in ticker)

### Scenes
- [ ] Prev/next scene navigation within the video player (currently must close and pick from grid)
- [ ] Scene card thumbnails are a fixed 100px height — feel small on large screens

### Archive
- [ ] Wide table layout (6 columns) is cramped on mid-size tablets — needs a responsive breakpoint between narrow and wide
- [ ] Mood filter chips and sort control wrap awkwardly on some screen sizes

### Data gaps
- [ ] Ghetto Symphony Pt. 1 (`mix-046`) and Pt. 2 (`mix-075`) have no tracklist — add manually if descriptions available

### Performance
- [ ] `js/images.js` is 307KB and loads synchronously before React — delays first render on slow connections

### Accessibility
- [ ] Scene cards have no keyboard navigation (Tab/Enter to select)
- [ ] No visible focus styles on interactive elements

### Footer / About
- [ ] "About" section has placeholder branding text — add short bio, release schedule, social links context

### Merch / Monetization
- [ ] Set up merch store (Printful/Printify print-on-demand) — can launch as sole proprietor, doesn't require the LLC or 50k-subscriber label milestone
- [ ] Add merch link/section to site nav or footer, matching Wired/Navi branding
- [ ] Decision (2026-07-09): merch goes live *before* record-label formation — reinforces brand and tests revenue early; reassigning the store to the LLC later is low-friction

---

---

## Phase 3.5 — Countdown page (pre-launch holding page)

A static `countdown.html` is deployed on Cloudflare Pages as a holding page while the full site is being built.

### How it works
- **File**: `countdown.html` at the project root — self-contained single-file page with all CSS inline
- **Routing**: `_redirects` rewrites `/` → `/countdown.html` with a 200 (rewrite, not redirect), so visitors hit the countdown without seeing the URL change
- **Design**: matches the main site aesthetic — IBM Plex Mono, scan lines, `--void` background, green accent

### Favicons
- **Tab favicon**: `public/assets/images/favicon-pylon.svg` — SVG of SEL-inspired power line transmission tower (#18 design). Uses `currentColor` + `prefers-color-scheme` media query: green `#8fbf9f` in dark mode, near-black `#1a1a1a` in light mode. glow filter applied to `<g>`. 3 widening cross-arms, diagonal braces, insulator circles at arm ends, drooping catenary wire curves, ground anchor. viewBox 0 0 96 96. macOS/iOS "Auto Appearance" switches this at sunrise/sunset automatically.
- **New tab / bookmark icon**: `public/assets/images/apple-touch-icon-pylon.png` — 180×180 PNG, `#0d0d0d` background, generated from the SVG via qlmanage + Pillow.
- **Old WT icons kept**: `favicon-wt.svg` and `apple-touch-icon-wt.png` remain in the folder but are no longer referenced.
- **Regenerating icons**: render `favicon-pylon.svg` via `qlmanage -t -s 180 -o /tmp/out/ favicon-pylon.svg`, then composite onto `#0d0d0d` canvas with Pillow. Always bump the `?v=N` cache-buster in the `<link>` tags after regenerating.

### To go live with the real site (cutover checklist)
- [ ] Delete or empty `_redirects` (removing the rewrite rule exposes `index.html` as the Cloudflare Pages default)
- [ ] Optionally delete `countdown.html` — it is no longer served after `_redirects` is removed
- [ ] Confirm `index.html` loads correctly on the deployed URL
- [ ] Verify audio, scenes, and JSON fetch all work in production (CORS, asset paths)
- [ ] Consider enabling Cloudflare Web Analytics alongside Umami — Cloudflare is server-side (catches bots + ad-blocker users), Umami is JS-based (real humans only). The gap between their numbers reveals how many visitors block scripts. Not urgent pre-launch but worth reviewing once real traffic arrives.

> **Do not touch `_redirects` until the full site is ready to go live.** Removing it immediately exposes `index.html` to all traffic.

---

## Analytics — Umami

Umami is live on both pages. No consent popup is required — Umami is cookieless and collects no personal data (GDPR-compliant by design).

### Setup
- **Instance**: self-hosted on Railway at `https://umami-production-3b7d.up.railway.app`
- **Script**: `<script defer src="https://umami-production-3b7d.up.railway.app/script.js" data-website-id="b3e9a766-c21b-4acb-8b35-bf120b3f2aef"></script>`
- **Pages tracked**: `countdown.html` (lines 291–292) and `index.html` (lines 10–11)
- Both pages use the same `data-website-id`

---

## Phase 4 — Backend / API

FastAPI backend with endpoints:
- `GET /api/mixes`
- `GET /api/mixes/latest`
- `GET /api/scenes`
- `GET /api/scenes?page=1`
- `GET /api/scenes?tag=rainy`

Can still read from JSON initially, then swap to PostgreSQL.

### Progress (as of 2026-07-09)
- `backend/main.py` — FastAPI app with CORS middleware, mounts `mixes` and `scenes` routers under `/api`
- `backend/routers/mixes.py` — `GET /api/mixes` implemented; `GET /api/mixes/latest` has a bug (references undefined `sorted_mixes` instead of the `sorted(...)` result — needs fixing)
- `backend/routers/scenes.py` — `GET /api/scenes` implemented with `page`, `limit`, `episode`, `mood` query params
- `backend/data/{mixes,scenes}.json` — copies of the metadata JSON for the backend to read
- Not yet done: `/api/mixes/latest` bug fix, `/api/scenes?tag=` filtering, PostgreSQL swap (Phase 5)

### Learning resources

Read these FastAPI docs sections in order before building:

1. [First Steps](https://fastapi.tiangolo.com/tutorial/first-steps/) — routes, JSON responses, auto docs
2. [Path Parameters](https://fastapi.tiangolo.com/tutorial/path-parameters/) — e.g. `/api/mixes/{id}`
3. [Query Parameters](https://fastapi.tiangolo.com/tutorial/query-parameters/) — e.g. `?page=1&mood=chill`
4. [Response Model](https://fastapi.tiangolo.com/tutorial/response-model/) — shaping what the API returns
5. [Bigger Applications](https://fastapi.tiangolo.com/tutorial/bigger-applications/) — splitting mixes/scenes into separate router files with `APIRouter`
6. [SQL (Relational) Databases](https://fastapi.tiangolo.com/tutorial/sql-databases/) — SQLAlchemy setup (relevant for Phase 5)

Skip everything else until you hit a specific need — body/request data, security, background tasks, WebSockets are not required for v1.

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
