# WeebTrax — Project Roadmap

Full dated build history lives in [`docs/CHANGELOG.md`](../docs/CHANGELOG.md) — not auto-loaded,
check it when you need the detailed "why" behind a past fix. This file stays lean on purpose: it's
loaded into every session automatically.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | Local media organization | ✅ Complete |
| 2 | JSON metadata | ✅ Complete |
| 3 | Website reads JSON | ✅ Complete |
| 3.5 | Countdown page (pre-launch holding page) | ✅ Live |
| 4 | Create backend / API (FastAPI) | 🟨 In progress — models/routers/seeding split into separate files, backed by a real database, frontend now wired to it |
| 5 | Move JSON metadata into PostgreSQL | 🟨 In progress — local Postgres running, schema + seeding done, frontend wired to the API; not yet on Railway |
| 6 | Deploy with Railway | ⬜ Not started |
| 7 | Move large media to storage bucket (Cloudflare R2) | ⬜ Not started — **hard launch blocker**, media is gitignored so Pages would ship a site with every mix/scene 404ing |
| Pre-launch | Verification, Cloudflare config, launch procedure | ⬜ Not started |

Post-launch work (not gating launch) lives in a separate [Post-Launch Roadmap](#post-launch-roadmap) section below, starting with Phase 8.

---

## Git conventions

- Do **not** add a `Co-Authored-By: Claude` trailer to commit messages in this repo.
- Keep commit message bodies in plain, non-technical language — avoid jargon like "SQLModel table=True", "autoincrement primary key", "Pydantic BaseModel", "relationship", etc. Keep the existing `type(scope): summary` prefix style, but describe what changed and why the way you'd explain it to someone skimming `git log` who isn't deep in that session's code.

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

- Mix thumbnails live in `public/assets/scenes/thumbnails/` — user-selectable, not assigned per mix
- 94 mixes converted from `.mp4` → `.mp3` and copied to `public/assets/mixes/audio/`
- 48 scene clips across episodes 1–13, named `episode-XX_clip-NN.mp4` (sequential per episode)

### Known issue (2026-08-20) — resolved 2026-08-29
- [x] ~~All 48 scene video clips are missing~~ from `production/public/assets/scenes/videos/` — lost when a root-level `public/` directory was deleted, not realizing `production/public/assets/mixes/audio` and `production/public/assets/scenes/videos` were symlinked directories pointing back into it. No Trash/Time Machine recovery was available. Mix audio (94 + 5 new) was separately recovered from the flash drive's `Mastered`/`Unmastered` folders. Thumbnails (`public/assets/scenes/thumbnails/`) and `scenes.json` metadata were unaffected.
  - **Resolution (2026-08-29)**: raw un-renamed clips were still present on the flash drive at `lain-episodes/tools/scene-detect/episode-XX/clips/`, so no re-shoot/re-extract from the source episodes was needed. 9 of the 48 raw clips turned out to be 10-bit H.264 (`yuv420p10le`, inherited from the `hi10p` BDRip source via the original `-c:v copy` lossless extraction) — most browsers/players can't decode 10-bit H.264 reliably, which is why some clips would stop playing partway through even though ffprobe showed no truncation or corruption. Fixed by re-encoding all 48 to standard 8-bit `yuv420p` H.264 with `tools/rebuild_scene_clips.py`, which maps each raw clip to its final `episode-XX_clip-NN.mp4` name via the same `RENAME_MAP` already used by `tools/generate_scenes_json.py`. `tools/check_scene_clips.py` (truncation/decode-error/10-bit scanner) is available for re-checking clip health going forward.
  - **Per-clip corrections pass (2026-08-29)**: individually retrimmed/re-cut several clips and added a seamless boomerang (forward + reversed) treatment to many others. Boomerang builds use frame-index trimming (drop first+last frame of the reversed branch, verified via exact `nb_frames` match), not time-based epsilon trimming — the latter proved unreliable in both directions across different clips. Some clips needed footage pulled directly from the source `.mkv` past where the flash-drive raw clip cut off short; the raw clip's own `clip_tXXXXs` filename timestamp is only a nominal label, not a reliable exact source timestamp (confirmed wrong on at least two non-"seg"-suffixed clips), so any future re-cut from source should verify alignment by comparing a candidate frame against the existing raw clip before trusting the filename's timestamp. Scene player in `production/js/sections1.js` was also changed from the native `<video loop>` attribute to a manual `ended`-event restart (`v.currentTime = 0; v.play()`), since native loop restart overhead was noticeably choppy on very short (~1s) clips. A few scenes were removed outright (bad/duplicate content) — current scene count lives in `scenes.json`, not hardcoded here since it will keep changing.

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
- **Note (2026-08-20)**: all 48 scenes currently come from Serial Experiments Lain only, and `episodeNumber` implicitly assumes a single show. Plans to add scenes from other anime are deferred to post-launch — see [Phase 11](#phase-11--multi-anime-scenes--scene-mood-filter).

---

## Phase 3 — Website reads JSON

Frontend dynamically loads `mixes.json` and `scenes.json` instead of hardcoded HTML — ✅ complete. 94 mixes and 48 scenes render with mood filter, sort, pagination, episode filter, scene player, and full mobile responsive layout. Build history/detail in [CHANGELOG.md](../docs/CHANGELOG.md#phase-3--website-reads-json).

### Running the site locally
Serve with: `cd production && python3 serve.py` — use `serve.py`, NOT `python3 -m http.server 3000` (the built-in server crashes on dropped audio connections) and NOT `python3 -m serve.py` (module mode, wrong). `serve.py` silences `BrokenPipeError`/`ConnectionResetError` from Safari dropping audio streams mid-response. Site must be served from `production/` — serving from the repo root causes `/public/assets/metadata/*.json` 404s and a BOOT FAILURE screen.

### Responsive breakpoints (width-only — no orientation/device detection)
- `<600px` — mobile: `mobile.css` loads, rail hidden, bottom nav shows
- `600–899px` — compact desktop: 48px rail, tablet table layouts, single-col footer/submissions
- `900px+` — full desktop: 112px rail, 5-col archive table, 3-col footer
- `900–1100px` — section padding scales fluidly via `clamp()` rather than snapping
- `1100px+` — wide layouts, 2-col submissions
- `1200px+` — episode filter buttons enlarge

Landscape phones always get the desktop layout at their actual width — never orientation-detected. This avoids CSS and JS disagreeing about whether the viewport is "mobile."

### Known gotchas — read before touching audio, mobile layout, or React state
- **Background audio must never pause on tab hide.** The `visibilitychange` handler must never pause audio or suspend the AudioContext on `hidden` — music is meant to keep playing through lock screens/tab switches. Only cancel in-flight fade callbacks there; resync from `audio.currentTime`/`audio.paused` on `visible`.
- **iOS fade race condition.** `fadeOut()` resumes a suspended AudioContext asynchronously before scheduling the actual fade; if `fadeIn()` fires in that gap, audio can cut out mid-play (the "vinyl scratch" bug). Any new play/pause path must call the existing abort mechanism (`fadeOutAbortRef`) before doing its own work.
- **Use `audio.paused`, not React state, to decide play/pause.** React state can go stale across a lock/unlock cycle — always read the DOM element's ground truth instead.
- **Never set `overflow-x: hidden` on `html` or `body`.** It blocks all horizontal touch-scroll on iOS Safari, even inside child elements that should scroll (mood chips, episode filter). Use `max-width: 100%` + JS-controlled margins instead. Horizontally-scrolling strips also need `touch-action: pan-x pan-y` (not just `pan-x`), or vertical page scroll breaks.
- **React hooks rule:** never place a hook call after a conditional early `return` in a component — causes "rendered fewer hooks than expected" when the condition flips.
- **Mobile `:hover` gets stuck after tap.** Any hover-only style must live inside `@media (hover: hover)`, or touch devices get stuck in a hover-highlighted state after tapping (there's no "leave" event on touch).
- **`navigator.clipboard` is `undefined` over plain HTTP or a local network IP** (it needs a secure context). Calling `.writeText` on it throws synchronously, before any `.then/.catch` runs. Copy buttons must go through a helper with an `execCommand('copy')` fallback.
- **Use the `isMobile` hook (matchMedia), not a raw pixel-width comparison, for mobile-only visuals.** Comparing `winW` directly against the CSS breakpoint can disagree by 1px at the boundary and briefly render both mobile and desktop versions at once.
- **Set mobile layout margins via JS, not a CSS override.** `<main>`'s margin and the broadcast bar's position are set directly in `app.js` (`isMobile ? 0 : railW`) — don't rely on a `!important` CSS rule to fix the inline style, since stale CSS caching can silently break it.
- **Character/portrait accent PNGs can carry large transparent padding.** Always check the alpha-channel content bounds, not the raw `<img>` box, before computing an "edge-aligned" position.
- **When reverting a conditional style override, match the base style's property form** (shorthand vs. longhand) — clearing a longhand key (e.g. `borderColor`) doesn't restore a shorthand's (`border`) original value.

### Open items
- [ ] Previous track button — auto-advance only goes forward
- [ ] Shuffle mode
- [ ] Scene cards have no keyboard navigation (Tab/Enter to select)
- [ ] No visible focus styles on interactive elements
- [ ] About section has placeholder branding text — needs short bio, release schedule, social links
- [ ] Small touch targets remain on COLLAPSE/DISCONNECT buttons and pagination page-number buttons
- [ ] Overall mobile layout is still CSS overrides on a desktop structure — a first-class mobile pass would help spacing/typography/rhythm
- [ ] **iOS Safari overscroll grey reveal** — rubber-banding past the top/bottom exposes iOS's grey system canvas behind the dark background. `overscroll-behavior-y: contain` prevents bounce-chaining but doesn't fully fix it. Already tried and failed: `color-scheme: dark`, `theme-color`, a pinned `body::before`, negative-margin `min-height: 100svh`, and making `body` `position: fixed` with `main` as the scroll container (breaks `window.scrollY`/`scrollTo`/all scroll listeners). A real fix needs either moving scroll ownership fully to `<main>`, or a future Safari version respecting `html { background-color }` in the overscroll zone.
- Mood filter chips for Scenes + multi-anime scene support — deferred, see [Phase 11](#phase-11--multi-anime-scenes--scene-mood-filter)

---

## Phase 3.5 — Countdown page (pre-launch holding page)

A self-contained countdown page deployed on Cloudflare Pages as a holding page while the full site is being built.

### Repository structure (as of 2026-07-10)

```
countdown/                  ← Cloudflare Pages deploys ONLY this directory
  index.html                ← countdown page (self-contained, inline CSS)
  fonts/
    loveletter.ttf          ← Love Letter TW font
  images/
    favicon-pylon.svg       ← tab favicon
    apple-touch-icon-pylon.png

production/                 ← never deployed pre-launch, lives only in git
  index.html
  css/
    styles.css
    mobile.css
  js/
    app.js, core.js, sections1.js, sections2.js,
    images.js, tweaks-panel.js, react.js, react-dom.js
  public/assets/
    metadata/mixes.json, scenes.json
    scenes/thumbnails/
    images/
    fonts/
```

### How it works
- **Cloudflare Pages build output directory**: `countdown` — only files inside `countdown/` are deployed; `production/` is never uploaded to Cloudflare
- **No `_redirects` needed**: `countdown/index.html` is the directory index, served automatically at `weebtrax.com/`
- **Design**: matches the main site aesthetic — IBM Plex Mono, scan lines, `--void` background, green accent
- **Launch target**: `2026-08-29T12:00:00` (local time) — hardcoded in `countdown/index.html` JS

### Favicons
- **Both sites now use the WeebTrax CD brand icon** (replaced the pylon SVG as of 2026-07-29)
- **Source of truth**: `brand/favicon/` — all sizes generated by `python3 brand/favicon/gen_favicon.py`
- **Regenerate**: run the script, then copy outputs to `countdown/images/` and `production/public/assets/images/`; `favicon.ico` also goes to each site root (`countdown/`, `production/`)
- **Formats produced**: `favicon.svg` (scalable, embeds 512px PNG as base64), `favicon-16x16.png`, `favicon-32x32.png`, `favicon-48x48.png`, `favicon-96x96.png`, `apple-touch-icon.png` (180×180), `icon-192.png`, `icon-512.png`, `favicon.ico` (16+32+48 multi-size)
- **HTML link tags** (both sites): SVG first, then 32px and 16px PNG fallbacks, then `apple-touch-icon` — no `?v=` cache-busters (add one if forcing a re-fetch after an update)
- **Old pylon files preserved** at `countdown/images/favicon-pylon.svg` and `countdown/images/apple-touch-icon-pylon.png` — kept for reference, not linked anywhere

### Git branches
- `main` — contains both `countdown/` and `production/`; Cloudflare deploys from `countdown/` via build output directory setting
- `launch` — snapshot of the full production site at the old root structure (pre-restructure); kept as reference

---

## Analytics — Umami

Umami is live on both pages. No consent popup is required — Umami is cookieless and collects no personal data (GDPR-compliant by design).

### Setup
- **Instance**: self-hosted on Railway at `https://umami-production-3b7d.up.railway.app`
- **Script**: `<script defer src="https://umami-production-3b7d.up.railway.app/script.js" data-website-id="b3e9a766-c21b-4acb-8b35-bf120b3f2aef"></script>`
- **Pages tracked**: `countdown/index.html` and `production/index.html`
- Both pages use the same `data-website-id`

---

## Brand Identity System

All brand assets live under `brand/` in the repo root. Each asset type has its own subfolder. Generation scripts are co-located with their outputs so any set can be fully regenerated by running the script in its folder.

### Folder structure
```
brand/
  wordmark-primary/          ← Horizontal wordmark — 4000×1000 transparent PNG
    weebtrax-wordmark-black.png
    weebtrax-wordmark-white.png
    gen_wordmark.py

  wordmark-stacked/          ← Stacked secondary wordmark — 2000×2000 transparent PNG
    weebtrax-wordmark-stacked-black.png
    weebtrax-wordmark-stacked-white.png
    gen_wordmark_stacked.py

  icon/                      ← CD brand icon — 8 sizes (16–1024px) + source
    weebtrax-icon-source.png        ← canonical transparent source (1254×1254)
    weebtrax-icon-1024.png          ← master (74.2% fill, ~760px icon in 1024px canvas)
    weebtrax-icon-{512,256,128,64,48,32,16}.png
    gen_icon.py

  combination-logo/          ← CD icon + wordmark lockups
    weebtrax-logo-horizontal-{black,white}.svg
    weebtrax-logo-horizontal-{black,white}-{3000,2000,1000}px.png
    weebtrax-logo-vertical-{black,white}.svg
    weebtrax-logo-vertical-{black,white}-{3000,2000,1000}px.png
    gen_combo_logo.py

  mascot/                    ← WeebTrax mascot (CD v2 — anime character holding CD)
    weebtrax_mascot_4096.png
    weebtrax_mascot_2048.png
    weebtrax_mascot_1024.png
    weebtrax_mascot_512.png

  favicon/                   ← Favicon assets for both sites — generated from brand/icon source
    favicon.svg              ← scalable SVG (embeds 512px PNG as base64)
    favicon-16x16.png
    favicon-32x32.png
    favicon-48x48.png
    favicon-96x96.png
    apple-touch-icon.png     ← 180×180 iOS home screen
    icon-192.png             ← 192×192 Android PWA / manifest
    icon-512.png             ← 512×512 PWA splash
    favicon.ico              ← multi-size ICO (16, 32, 48)
    gen_favicon.py
```

### Typography
- **Font**: Love Letter TW (`countdown/fonts/loveletter.ttf`)
- **Wordmark**: "WEEBTRAX" all-caps — WEEB and TRAX are naturally identical widths in this font (within 4px at any size), so no tracking is needed for the stacked layout

### Icon
- Source: `brand/icon/weebtrax-icon-source.png` — background removed via BFS flood fill from edges + centre hole separately; threshold 238
- All icon sizes derived from this single source via LANCZOS downscaling
- Regenerate: `cd brand/icon && python3 gen_icon.py`

### Combination logo
- CD icon height = full wordmark canvas height (1000px) — approximately 1.87× the cap height — so the disc has visual weight equal to the text
- Horizontal gap = 30% of CD diameter; vertical gap (stacked) = 50% of CD diameter
- Clear space on all sides = 50% of CD diameter
- SVGs embed both source rasters as separate `<image>` elements (not a flat composite), so they scale cleanly at any zoom
- Black variant = light backgrounds; white variant = dark backgrounds
- Regenerate: `cd brand/combination-logo && python3 gen_combo_logo.py`

### Mascot
- WeebTrax mascot: anime-style character holding a CD (CD v2), CD artwork visible through disc
- Source: `weebtrax-cd-v2-transparent.png` (1254×1254) — white background removed via BFS flood fill with 40px canvas padding so disc edge never seeds the fill
- All exports generated directly from the 1254px source; no chained scaling
- Future brand assets should always go into their own subfolder under `brand/`

---

## Phase 4 — Backend / API

FastAPI backend with endpoints:
- `GET /api/mixes`
- `GET /api/mixes/latest`
- `GET /api/scenes`
- `GET /api/scenes?page=1`
- `GET /api/scenes?tag=rainy`

Reads from PostgreSQL now (locally); JSON files are only used to seed the database, not read at request time.

### Status (as of 2026-08-29)
- `backend/main.py` — FastAPI app with CORS middleware, mounts `mixes` and `scenes` routers under `/api`
- `backend/database.py` — shared `engine`/`get_db`/`create_db_and_tables`, one database for both routers (was two separate SQLite files per-router, consolidated)
- `backend/models/mix.py`, `track.py`, `scene.py` — table + public response models (`MixBase`/`Mix`/`MixPublic`/`MixWithTracks`, same pattern for `Scene`/`Track`), split out of the routers; all fields renamed to snake_case (`release_date`, `audio_path`, `episode_number`, etc.) — JSON fixtures still use the frontend's camelCase, translated during seeding
- `backend/seed.py` — loads `backend/data/{mixes,scenes}.json`, translates field names, and seeds the database; `backend/init_db.py` is the entry point that creates tables + seeds both
- `backend/routers/mixes.py` — `GET /api/mixes` (now `order_by(Mix.id)` + `selectinload(Mix.tracks)`, returns `MixWithTracks` so every mix carries its full tracklist — the frontend needs this for every row, not just the active one), `GET /api/mixes/latest` (`limit` capped `le=20`), `GET /api/mixes/popular` (sorted by views), `GET /api/mixes/slug/{slug}`, `GET /api/mixes/{mix_id}` (includes tracklist), `PATCH /api/mixes/{mix_id}/views`
- `backend/routers/scenes.py` — `GET /api/scenes` (deterministic `order_by(episode_number, id)`, page/limit/episode/mood filters), `GET /api/scenes/{scene_id}`
- `Mix.tracks` relationship now carries `order_by="Track.time_secs"` — without it, tracklist entries had no guaranteed order, which the frontend's "current track" lookup depends on
- Indexes added on `Mix.slug`, `Mix.mood`, `Scene.slug`, `Scene.mood`, `Scene.episode_number`
- **Frontend now wired to the API** (2026-08-29): `production/js/app.js` fetches `http://localhost:8000/api/mixes` and `/api/scenes?limit=50` instead of the static JSON files, then maps the snake_case API shape back to the camelCase shape the rest of the frontend already expects (`wtMapMix`/`wtMapScene`). Integer PKs are turned back into the `mix-001`/`scene-001` string IDs the UI displays (`TX-` codes, session restore) — safe because seeding order matches the original JSON order, so PK 1 is always `mix-001`. `WT_API_BASE` is hardcoded to localhost for now; will need to become the real URL once Phase 6 puts the backend on Railway. `mixes.json`/`scenes.json` are no longer read by the live site, only by `backend/seed.py`.
- Open: SQL `COUNT()` for scenes pagination total (currently `len(session.exec(statement).all())`) is an optimization, not urgent at current scene counts; `/api/scenes` `limit` is capped `le=50`, which happens to cover all current scenes but will need raising (or real pagination on the frontend) once scene count passes 50 — see full detail in [CHANGELOG.md](../docs/CHANGELOG.md#phase-4--backend--api)

### Learning resources

**Learned and applied**: [SQL (Relational) Databases](https://fastapi.tiangolo.com/tutorial/sql-databases/) (SQLModel table/session/relationship patterns, now running against real Postgres) and Dependencies (`Depends`) — the `db: Session = Depends(get_db)` pattern is used throughout both routers now, not just planned for later.

**Already learned**: First Steps, Path Parameters, Query Parameters, Request Body, [Handling Errors](https://fastapi.tiangolo.com/tutorial/handling-errors/), [Response Model](https://fastapi.tiangolo.com/tutorial/response-model/), [Path Operation Configuration](https://fastapi.tiangolo.com/tutorial/response-status-code/), [Path & Query Validation](https://fastapi.tiangolo.com/tutorial/query-params-str-validations/) — all applied in `backend/routers/mixes.py` and `scenes.py`.

**Already effectively covered, skip the tutorial**:
- CORS — already implemented in `backend/main.py`; skim the docs page to understand the existing code, don't treat as new material
- Bigger Applications — already applied (`routers/mixes.py`, `routers/scenes.py` split via `APIRouter`)

**Defer further** (only relevant once building the track submission backend, Phase 8 individual mix pages, or an admin/auth surface — none of which gate launch):
- Body Fields, Multiple Body Parameters, Nested Models, Body Updates (PUT/PATCH) — no write endpoints exist yet; everything is `GET`
- Forms, File Uploads — this *is* the submission-form work; don't front-load it
- Security (OAuth2 + JWT) — no user accounts or protected routes planned pre-launch
- Background Tasks — relevant later for the scheduled yt-dlp view-count refresh, not required for MVP
- Middleware (beyond CORS) — nothing else on the roadmap needs it
- Testing — good habit, but not blocking a solo-project MVP; revisit once Postgres lands

---

## Phase 5 — PostgreSQL

JSON fields become table columns. DB stores metadata + file paths only (not files themselves).

### Status (as of 2026-08-29)
- Local PostgreSQL 16 installed via Homebrew (`brew install postgresql@16`, `brew services start postgresql@16`), `weebtrax` database created with `createdb`
- Local connections use "trust" auth (Homebrew's default for this install) — no password needed for local dev
- `backend/database.py` reads `DATABASE_URL` from the environment, falling back to `postgresql+psycopg://localhost:5432/weebtrax` for local dev; `psycopg[binary]` added as a dependency
- Schema created via `SQLModel.metadata.create_all` (`backend/init_db.py`), seeded from the JSON fixtures via `backend/seed.py` — same models/routers from Phase 4, just pointed at Postgres instead of SQLite
- Frontend now reads from the API instead of `mixes.json`/`scenes.json` directly (see Phase 4 status above) — that was the last piece of this phase treated as a separate step; not yet done: Postgres on Railway (Phase 6's job)
- **Seeding is idempotent** (2026-08-29): `add_sample_mixes`/`add_sample_scenes` skip if their table already has rows, so re-running `python -m backend.init_db` is safe. Before this, a second run silently inserted a whole second copy (198 mixes, no error) — a real hazard for Phase 6, where a seed step wired into a Railway deploy would double the archive on every push. To deliberately re-seed after editing the JSON files, use `python -m backend.init_db --reset`, which truncates with `RESTART IDENTITY` first. **The identity restart is not optional**: the frontend derives display codes from the primary key (`id 1` → `mix-001`), so re-seeding without resetting the counters would shift every `TX-` code on the site.

---

## Phase 6 — Deploy with Railway

- Frontend → Cloudflare Pages
- Backend/API → Railway
- Database → PostgreSQL on Railway

### Prep done (2026-08-29), before any Railway account existed
- `railway.json` — NIXPACKS builder, start command binds `$PORT` (`uvicorn backend.main:app --host 0.0.0.0 --port $PORT`), healthcheck on `/health`
- `backend/main.py` — added a `GET /health` liveness endpoint for that healthcheck; CORS `allow_origins` now reads the `ALLOWED_ORIGINS` env var (comma-separated), falling back to localhost:3000 for local dev, instead of the old wide-open `["*"]`. Set `ALLOWED_ORIGINS=https://weebtrax.com` on Railway.
- CORS `allow_methods` was `["GET"]` only, which silently blocked `PATCH /api/mixes/{mix_id}/views` from any browser — now `["GET", "PATCH"]`.
- `production/js/app.js` — `WT_API_BASE` no longer hardcodes localhost; it picks `http://localhost:8000/api` when the page is served from localhost/127.0.0.1 and `https://api.weebtrax.com/api` otherwise. Override with `window.WT_API_BASE` before the script loads. **The `api.weebtrax.com` subdomain still has to be pointed at the Railway service** — until then production falls back to a host that doesn't resolve.

---

## Phase 7 — Media storage bucket (REQUIRED for launch, not optional)

Move large files out of the repo to Cloudflare R2. DB paths change from `/assets/...` to `https://media.weebtrax.com/...`.

**This is a hard launch blocker** — it was previously written as "if needed", which was wrong. Two independent reasons (verified 2026-08-29):
1. `.gitignore` excludes `*.mp3` and `*.mp4`, and Cloudflare Pages deploys from git — so flipping the build output to `production/` today ships a site where **every mix and scene 404s**. The media has never been in the repo.
2. Even un-ignoring them wouldn't work: **103 files exceed Cloudflare Pages' 25 MiB per-file limit** (largest single mp3 is 226 MB).

Current media footprint: **8.3 GB total** — 7.9 GB audio (99 mp3), 379 MB scene video (44 mp4), 2.7 MB thumbnails, 23 MB images. R2's free tier is 10 GB with **zero egress fees**, so this costs $0/mo at current size and stays cheap past it (~$0.015/GB/mo).

**Post-launch optimization, deliberately NOT done pre-launch:** 20 of the 99 mp3s are constant 320 kbps (the rest are already ~172–184 kbps VBR). Re-encoding just those 20 to ~192 kbps would save roughly 1.8 GB and speed up first-play for users. Skipped because 8.3 GB already fits the free tier and re-encoding is lossy-on-lossy — not worth delaying launch.

---

# Post-Launch Roadmap

Improvements planned for *after* the site is live. Not required before launch — do not let these block Phases 1–7 or the Pre-Launch Steps below.

## Phase 8 — Individual Mix Pages (Hybrid Upload Model)

**Status**: Planned, not yet built. Depends on Phase 4/5 (FastAPI backend + PostgreSQL) being in place.

Each mix gets uploaded in two parallel forms that converge through the backend:

```
                  Upload Mix
                      │
             ┌────────┴────────┐
             │                 │
      YouTube Video      MP3/Audio File
             │                 │
             │          FastAPI Backend
             │                 │
             └─────────┬───────┘
                       │
                WeebTrax Website
```

The website becomes the primary place to listen (via the audio player), while YouTube is an optional companion for people who enjoy the visuals or want to comment/subscribe — not a replacement for either path.

Planned per-mix page layout:
```
────────────────────────────
Now Playing

▶ Audio Player

Title
Length
Tracklist

────────────────────────────

Watch the visual mix on YouTube

[ Watch on YouTube ]
```

This extends the existing archive row/active-player pattern into a dedicated page per mix, still backed by the same `audioPath`/`youtubeUrl`/`tracklist` fields already in `mixes.json` (see Phase 2 schema above) — no new data model needed, just a new route/view once the FastAPI backend and per-mix pages exist.

**Important**: the YouTube video is a `[ Watch on YouTube ]` link/button out to the YouTube page, not an embedded `<iframe>` player on the mix page. Audio playback stays native to WeebTrax; YouTube is only ever one click away, never auto-loaded.

### FastAPI learning tie-in

This phase doubles as the next stretch of backend learning past the read-only endpoints in Phase 4. As backend skills grow, build toward:

- `GET /mixes`
- `GET /mixes/{id}`
- `POST /artists/submissions`
- `GET /artists`
- `POST /favorites`
- `GET /history`
- `POST /play`

These move the API from static JSON reads (Phase 4) into real read/write endpoints — submissions, favorites, play history — which is also what Phase 5 (PostgreSQL) needs tables for.

---

## Phase 9 — Light / Dark Mode

**Status**: Planned, not started (added 2026-08-07). **Must ship before Phase 10 (Merch)** — do the theme work first so merch UI/branding is built against both themes from the start rather than retrofitted.

Add a theme toggle so visitors can switch between the current dark "Wired/Navi" look and a light mode variant.

**Architecture note for whoever builds this**: colors are currently NOT CSS variables — they're a plain JS object, `WT2` (defined in `js/core.js:5`), consumed via inline `style` props across every component (`js/core.js`, `js/sections1.js`, `js/sections2.js`, `js/app.js`). `css/styles.css` and `css/mobile.css` also have their own hardcoded hex/rgba colors independent of `WT2`. There is no existing token indirection layer, so this isn't a small CSS-variable swap — it requires either:
- (a) converting `WT2` into a function of the active theme (e.g. `getWT2(theme)`) plus a React context/state for the current theme, threaded through every component that currently reads `WT2.*` directly, and mirroring the same light/dark split into the hardcoded colors in both CSS files, or
- (b) migrating `WT2` values and the CSS hardcoded colors to real CSS custom properties (`--wt-ink`, `--wt-void`, etc.) scoped under a `[data-theme]`/`.light` root attribute, then updating call sites to reference `var(--wt-*)` instead of `WT2.*` — larger upfront refactor but avoids re-render/context plumbing.

Scope also includes: persisting the choice (`localStorage`), a toggle control (rail or nav), deciding whether light mode needs its own accent/mood-tag palette (`chill/nostalgic/dirty/deep` colors currently tuned for a dark background), and auditing images/thumbnails that assume a dark surrounding (hero Ken Burns fades, video player chrome, scan-line/glow effects that may not read well on light backgrounds).

---

## Phase 10 — Merch / Monetization

- [ ] Set up merch store (Printful/Printify print-on-demand) — can launch as sole proprietor, doesn't require the LLC or 50k-subscriber label milestone
- [ ] Add merch link/section to site nav or footer, matching Wired/Navi branding
- [ ] Decision (2026-07-09): merch goes live *before* record-label formation — reinforces brand and tests revenue early; reassigning the store to the LLC later is low-friction

---

## Phase 11 — Multi-Anime Scenes & Scene Mood Filter

**Status**: Planned, not started (added 2026-08-20).

All 48 Scenes clips currently come from a single show, Serial Experiments Lain (episodes 1–13). Plans are to expand the Scenes section with clips from other anime as well. This phase covers the schema and UI changes that unlocks.

- [ ] **Add a show/series identifier to each scene** — `episodeNumber` alone can't disambiguate which show an episode number belongs to once multiple anime are present. Add a field (e.g. `series` or `animeTitle`) to each entry in `scenes.json` (both `production/public/assets/metadata/scenes.json` and `backend/data/scenes.json`).
- [ ] **Update the episode filter UI** (`sections1.js`, `SceneGrid`) to filter/group by show first, then by episode within that show, instead of assuming episode numbers are globally unique.
- [ ] **Add mood filter chips to Scenes**, mirroring the existing Archive mood-chip UI (`sections2.js`). The backend already supports this — `GET /api/scenes?mood=` and the `Mood` enum in `backend/models/enums.py` — and every scene already has a `mood` value in `scenes.json`, it's just unused on the frontend today. Mood becomes a more valuable cross-show browsing axis once episode number stops being unambiguous across shows.
- [ ] Audit scene card `type` badges (e.g. "CLUB TERMINAL") and `description` prose style for whether they should stay Lain-specific or generalize across shows.

---

# Pre-Launch Steps

Complete these steps in order immediately before going live. All development phases (1–7) should be finished before starting here.

---

## Step 1 — Pre-Launch Verification Checklist

### Countdown Website Verification

Confirm the countdown website:
- Loads correctly at `https://weebtrax.com` (no `/countdown` in the URL)
- Loads correctly on desktop browsers, mobile browsers, and different screen sizes

Verify:
- [ ] Custom fonts load correctly
- [ ] Favicon loads correctly
- [ ] Images/assets load correctly
- [ ] Countdown timer functions correctly
- [ ] No JavaScript errors in the browser console
- [ ] No broken links

### Production Website Verification (Without Deploying)

Before launch, test the official website privately (locally or via private preview deployment). Do not expose it publicly before launch.

- [ ] Homepage loads correctly
- [ ] All navigation links work
- [ ] Images load
- [ ] CSS styles load
- [ ] JavaScript functions correctly
- [ ] Mobile responsiveness works
- [ ] Browser console contains no errors
- [ ] Audio files play correctly
- [ ] Scene videos play correctly
- [ ] JSON metadata loads (mixes, scenes)

### Security Verification

- [ ] Production files are not deployed to Cloudflare Pages
- [ ] `weebtrax.com/index.html` does not reveal the production website
- [ ] Production JavaScript files cannot be accessed
- [ ] Production images cannot be accessed
- [ ] Production JSON files cannot be accessed
- [ ] No API keys, tokens, or secrets exist in frontend files
- [ ] Cloudflare Pages build output directory is set to `countdown`

The only publicly available files should be:
```
countdown/
  index.html
  fonts/loveletter.ttf
  images/favicon-pylon.svg
  images/apple-touch-icon-pylon.png
```

### SEO / Indexing Verification

- [ ] Confirm the countdown page includes `<meta name="robots" content="noindex, nofollow">`
- [ ] Confirm no production pages are indexed — check `site:weebtrax.com`
- [ ] Remove any outdated indexed pages if necessary

---

## Step 2 — Final Cloudflare Pages Configuration

Verify Cloudflare Pages is configured correctly for the countdown period:

- **Production branch**: `main`
- **Build output directory**: `countdown`
- **Build command**: empty
- No `_redirects` workarounds
- No Cloudflare Redirect Rules active
- No Workers rewriting requests

Expected behaviour:
```
https://weebtrax.com → Countdown website
```

---

## Step 3 — Choose the Launch Deployment Strategy

### Option A — Change Build Output Directory (Current setup)

Change in Cloudflare Pages settings:
```
countdown  →  production
```

**Advantages**: Simple, fast, no branch switching.
**Disadvantages**: Countdown and production remain in the same branch — easier to accidentally deploy the wrong folder.

### Option B — Switch Git Branch (Recommended for a brand launch)

```
main (countdown)  →  launch (production website)
```

Change the Cloudflare Pages production branch from `main` to `launch`.

**Advantages**: Clean separation, isolated production code, easy rollback, less chance of accidental exposure.
**Disadvantages**: Requires keeping the `launch` branch up to date with production development.

> Recommendation: **Option A** if launching soon and `production/` is already up to date on `main`. **Option B** if you want cleaner long-term branch hygiene.

---

## Step 4 — Launch Day Procedure

### Before switching live
- [ ] Final production website review complete
- [ ] All files confirmed ready
- [ ] DNS confirmed correct
- [ ] SSL certificate confirmed active

### Launch steps

**Step 4.1** — Update Cloudflare deployment:
- Option A: Change build output directory from `countdown` to `production`
- Option B: Change production branch from `main` to `launch`

**Step 4.2** — Save settings and trigger a new deployment. Wait for status: `Success`.

**Step 4.3** — Verify live website:
- [ ] `https://weebtrax.com` loads the official homepage
- [ ] Navigation works
- [ ] Images load
- [ ] Fonts load
- [ ] JavaScript works
- [ ] Audio plays
- [ ] Scene videos play
- [ ] No console errors
- [ ] `https://weebtrax.com/index.html` loads the official website normally

---

## Step 5 — Post-Launch Cleanup

### Remove countdown-specific items
- [ ] Remove `<meta name="robots" content="noindex, nofollow">` from production pages and replace with normal SEO tags
- [ ] Optionally delete or archive the `countdown/` directory from `main`

### SEO launch tasks
- [ ] Submit sitemap
- [ ] Verify Google Search Console
- [ ] Verify Bing Webmaster Tools
- [ ] Confirm pages are indexed correctly

### Monitoring
After launch, monitor:
- Cloudflare analytics
- Umami analytics
- Website errors and broken links
- Failed asset requests
- User traffic
- Search indexing

### Enable Cloudflare Web Analytics (optional)
Cloudflare analytics are server-side (catch bots + ad-blocker users); Umami is JS-based (real humans only). The gap between their numbers reveals how many visitors block scripts.
