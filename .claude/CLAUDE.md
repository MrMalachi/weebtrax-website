# WeebTrax — Project Roadmap

Full dated build history lives in [`docs/CHANGELOG.md`](../docs/CHANGELOG.md) — not auto-loaded,
check it when you need the detailed "why" behind a past fix. This file stays lean on purpose: it's
loaded into every session automatically.

## Phases

> **WeebTrax launched 2026-08-29.** `weebtrax.com` serves the real site (Cloudflare Pages,
> build output `production/`), backed by `api.weebtrax.com` (FastAPI + Postgres on Railway)
> and `media.weebtrax.com` (8.3 GB of audio/video on Cloudflare R2). Audio playback verified
> in a browser. Run `python3 tools/preflight_check.py` before any deploy that touches the
> frontend, API or media — it exits non-zero if any part of the live stack is broken.


| # | Phase | Status |
|---|-------|--------|
| 1 | Local media organization | ✅ Complete |
| 2 | JSON metadata | ✅ Complete |
| 3 | Website reads JSON | ✅ Complete |
| 3.5 | Countdown page (pre-launch holding page) | ✅ Retired at launch — `countdown/` still in the repo, no longer deployed |
| 4 | Create backend / API (FastAPI) | ✅ Complete — live at `api.weebtrax.com`, frontend reads from it |
| 5 | Move JSON metadata into PostgreSQL | ✅ Complete — running on Railway Postgres, schema + seeding verified live |
| 6 | Deploy with Railway | ✅ Complete — backend + Postgres live, `api.weebtrax.com` serving with valid SSL |
| 7 | Move large media to storage bucket (Cloudflare R2) | ✅ Complete — 187 files on R2, served via `media.weebtrax.com` |
| Pre-launch | Verification, Cloudflare config, launch procedure | ✅ Done — Pages output switched to `production/`, site live and verified |

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
- [ ] **Player controls: shuffle + autoplay toggle** (idea logged 2026-09-03) — two YouTube-style buttons on the player:
  - **Shuffle** — when on, the next track is picked at random instead of the next row. Should avoid repeating a mix until the pool is exhausted (keep a shuffled play order or a "already played" set), not just call `Math.random()` each time, or short archives repeat immediately.
  - **Autoplay on/off** — when off, playback stops at the end of the current mix instead of advancing at all. Auto-advance is currently unconditional in `onEnded` (`production/js/app.js:414`), which walks `getMixes()` to the next index and falls back to `setPlaying(false)` at the end of the list. Both toggles change what that one handler does, so build them as a single "what plays next?" decision rather than two separate patches.
  - Persist both toggle states in `localStorage` alongside the existing session restore, and decide whether shuffle draws from the full archive or only the currently filtered/mood-chipped view (YouTube uses the visible queue — the filtered view is probably the less surprising choice).
  - Pairs naturally with the previous-track button above: with shuffle on, "previous" has to mean *history*, not index − 1, so keep a played-track stack that both features share.
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
- **Launch target**: `2026-08-29T12:30:00-04:00` — 12:30 US Eastern, hardcoded in `countdown/index.html` JS (moved from 12:00 on 2026-08-29). The `-04:00` offset is deliberate and must be kept: without an offset the string is parsed in each **visitor's** timezone, so the countdown hit zero at a different real-world moment in every region. Note `-04:00` is Eastern *daylight* time (Mar–Nov); a target set in winter needs `-05:00`.

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

### Status (2026-08-29) — backend + Postgres are LIVE on Railway ✅
- Project `shimmering-laughter`, service `weebtrax-website`, plus a `Postgres` service. Public URL: `https://weebtrax-website-production.up.railway.app`
- Verified working: `/health` → ok, `/api/mixes` → 99 mixes with tracklists, `/api/scenes` → 44 scenes, CORS allows `weebtrax.com` and blocks other origins. Schema creation + seeding run automatically on boot.
- **`api.weebtrax.com` is live (2026-08-29)** ✅ — added via `railway domain api.weebtrax.com --service weebtrax-website`, which returns both DNS records to create. Two records in Cloudflare: `CNAME api → d3bpoznd.up.railway.app` and `TXT _railway-verify.api → railway-verify=…` (ownership; Railway drops it from the list once verified). Verified: `/health` 200 with a valid cert, `/api/mixes` 99, `/api/scenes` 44, CORS returns `access-control-allow-origin: https://weebtrax.com` and sends no such header for other origins.
- **The CNAME must be "DNS only" (grey cloud) — the opposite of `media.weebtrax.com`.** R2 *requires* the orange cloud; Railway issues its own Let's Encrypt cert and needs to see the real request to validate ownership. With the orange cloud on and SSL mode "Flexible" you get an infinite redirect loop. Switching to proxied later requires SSL/TLS mode **Full (strict)**, and buys little for an API.
- Certificate issuance took ~4 minutes. During that window `https://api.weebtrax.com` returns nothing at all (curl exit code 000, not an HTTP error) — that's normal, not a misconfiguration. `railway domain status <id>` shows `Certificate status: …ISSUING` until it completes.

#### Deploy debugging — two stacked failures, both non-obvious
Worth reading before touching deploy config again; each cost a full deploy cycle.

1. **Nixpacks' runtime image had neither `python` nor `uv` on PATH.** The container crash-looped (`/bin/bash: line 1: python: command not found`, then the same for `uv`) while the Railway dashboard still showed **"Deployment successful / ACTIVE"** — the *build* succeeded, so only the deploy logs revealed the truth. Switching the start command to `uv run` just moved the error. Fixed for good with an explicit `Dockerfile` (`python:3.14-slim`, `uv sync --frozen --no-dev`, venv put first on PATH) plus a `.dockerignore` that keeps `production/`, `brand/` and media out of the build context. `railway.json` now sets `"builder": "DOCKERFILE"`.
2. **Variables were staged in the UI but never applied.** The Railway canvas showed a pending *"Apply 2 changes / Deploy"* button; the code deployed without `DATABASE_URL` or `ALLOWED_ORIGINS`, so the app fell back to the local-dev `localhost:5432` and died with `connection refused`. **Adding a variable in the Railway UI does nothing until that pending Deploy is clicked.** Setting them with `railway variables --set` applies immediately and avoids the trap.

**The Railway CLI is the fast path** (`brew install railway`, `railway login`, `railway link`). `railway logs --deployment` shows the real traceback, `railway status` shows Crashed-vs-Active honestly, and `railway variables` proves what the container can actually see. Screenshot round-trips hid all three root causes.

Note: `railway.json` (config-as-code) is deprecated in favour of `.railway/railway.ts`; existing files keep working until 2026-12-01, so migration is not urgent but is worth doing before then.

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

### Status (2026-08-29) — media is LIVE on R2 ✅
- Bucket `weebtrax-media`, custom domain `media.weebtrax.com` (SSL active). All **187 objects** uploaded (99 mp3 + 44 mp4 + 44 jpg, 8.296 GiB), verified with `rclone check` (187 matching, 0 differences) and by HTTP HEAD on every file (187/187 → 200, correct content types). `accept-ranges: bytes` confirmed, so audio seeking works.
- **Bucket layout drops the `public/assets/` prefix**: `mixes/audio/…`, `scenes/videos/…`, `scenes/thumbnails/…`.
- **Paths in the DB are bare keys, not full URLs** (`mixes/audio/foo.mp3`). The host is prepended at render time by `WT_MEDIA_BASE` in `production/js/core.js`, which resolves to `/public/assets` on localhost and `https://media.weebtrax.com` everywhere else — so local dev still serves local files and a future CDN change is a one-line edit rather than a re-seed. Mirrors the existing `WT_API_BASE` pattern. Consumed at three call sites: `sections2.js` (`audioSrc`) and `sections1.js` (`img`, `video`).
- `WT_MEDIA_BASE` lives in `core.js`, **not** `app.js`, because `app.js` loads last — `sections1/2.js` would otherwise reference a global defined in a later file.

#### rclone setup gotchas (both cost a debugging cycle)
- **Endpoint must not include `https://` twice.** The dashboard's "S3 API" value already carries the scheme; pasting it into a template that also had `https://` produced `https://https://<id>.r2.cloudflarestorage.com` and a `no such host` error.
- **`no_check_bucket = true` is required** for a bucket-scoped token. Without it rclone tries to *create* the bucket before uploading and fails with a misleading `CreateBucket … AccessDenied` 403. Relatedly, `rclone lsd r2:` (list all buckets) legitimately 403s with a scoped token — use `rclone ls r2:weebtrax-media` to test instead.
- Cloudflare's bot protection **403s the default `Python-urllib` User-Agent** on `media.weebtrax.com`. Any verification script must send a browser UA or it will report every file as broken. Real browsers and curl are unaffected.

#### Long-standing data bug found and fixed during the migration
9 of the 99 mixes had an `audioPath` that pointed at a file that has never existed: apostrophes were slugified to `-` in the path (`otto-s-anticlimax`) but **deleted** in the real filename (`ottos-anticlimax`). The `slug` field was always correct — only `audioPath` was wrong, so the two were generated by different slugify rules. These 9 mixes would have 404'd on play, and the bug predates this phase (it's in the old `production/public/assets/metadata/mixes.json` too). Fixed by deriving `audioPath` from `slug` for all 99 (`mixes/audio/{slug}.mp3`), verified against the real object list — 99/99 match, 0 missing.

#### Railway database re-seeded (2026-08-29) ✅
The deployed database held the old `public/assets/…` paths and had to be reset. Verified end to end afterwards: deployed `/api/mixes` returns bare keys, 0 rows with the old prefix, ids restarted at 1–99, and `media.weebtrax.com/<key>` returns 206 `audio/mpeg`.

**Order matters, and getting it wrong wastes a cycle:** `init_db --reset` re-seeds from the JSON files *baked into the container image*, not from your working copy. Running the reset before pushing the corrected JSON simply re-seeded the same wrong paths. The sequence is **push → wait for the new deploy to actually be live → then reset**. Confirm the container really has the new code first (`railway ssh --service weebtrax-website python -c "import json;print(json.load(open('backend/data/mixes.json'))[0]['audioPath'])"`) rather than assuming the deploy finished.

**Before running a destructive reset**, confirm the live data is purely derived from the JSON — compare row counts *and* `sum(views)` against the fixtures. They matched exactly (591371), proving nothing had drifted in production and the reset was lossless. If they ever diverge, something is writing to production that the fixtures don't capture (most likely `PATCH /api/mixes/{id}/views`) and a blind reset would destroy it.

#### Railway CLI access notes
- `railway ssh` needs a registered key (`railway ssh keys add`) **and** a one-time interactive host-key acceptance. The host-key prompt cannot be answered from a non-TTY shell — it must be run in a real terminal window once; afterwards non-interactive `railway ssh <cmd>` works fine.
- The Postgres service has **no public TCP proxy**, so `DATABASE_URL` is the internal `postgres.railway.internal` host and is unreachable from a laptop. Run database work *inside* the container via `railway ssh` rather than enabling public networking.

#### Cross-origin audio: the silent-playback trap (2026-08-29)
Moving media to R2 made audio **play silently** on the live site — timer ran, waveform moved, no sound. Two causes, and **both fixes are required; either alone still gives silence**:
1. The player routes audio through the Web Audio graph (`ctx.createMediaElementSource(audio)` in `app.js`) so it can do GainNode volume and fades. Feeding a **cross-origin** media element into that graph without CORS marks it "tainted" and the graph outputs silence — deliberately, so sites can't read audio from other domains. Fixed with `crossOrigin: 'anonymous'` on the `<audio>` element. **Never remove that attribute** while media is on a different host.
2. `media.weebtrax.com` must return `Access-Control-Allow-Origin`. Set via the bucket's **CORS Policy** in the R2 dashboard (the rclone token can't do this — it only reads/writes objects, not bucket config). The policy needs `AllowedHeaders: ["Range"]` and `ExposeHeaders: [Content-Length, Content-Range, Accept-Ranges]` or seeking breaks even once sound works.

This was invisible before R2 because the audio was same-origin. Note the failure mode is *silence, not an error* — nothing appears in the console.

**Ordering matters when fixing it:** deploy the `crossOrigin` attribute only *after* the bucket policy is live. With the attribute set but no CORS header, audio fails to load at all — worse than silent.

**Cloudflare caches responses from before the CORS policy existed**, and those cached copies have no header, so the fix looks like it isn't working. `cf-cache-status: HIT` + no `access-control-allow-origin` = stale cache, not a bad policy. Confirm by re-requesting with a `?cb=` cache-buster (a `MISS` will carry the header), then **Purge Everything** under Caching → Configuration.

#### Generator scripts — fixed 2026-08-29, and what they can/can't rebuild
`production/public/assets/metadata/{mixes,scenes}.json` were **deleted 2026-08-29** (unused once the frontend moved to the API, and carrying the old `public/assets/` prefix). `lain-clip-matches.json` was deliberately **kept** — 80 entries of curated mix→scene clip descriptions, useful for [Phase 11](#phase-11--multi-anime-scenes--scene-mood-filter).

Both generators now write to **`backend/data/`** (the real seed source, resolved relative to the script rather than the cwd), emit **bare R2 keys** (`mixes/audio/…`, `scenes/videos/…`), and **omit `id`** so the database assigns its own primary key.

**Correction to an earlier note in this file:** the apostrophe bug was *not* in `slugify` — that function already strips apostrophes correctly (it produces `ottos-anticlimax`). It was fixed at some point after the data was last generated, and the data simply never regenerated. The generator was never going to reintroduce it.

**`generate_scenes_json.py` is a faithful regenerator** — verified byte-identical to the committed `scenes.json`. Safe to re-run.

**`generate_mixes_json.py` is a bootstrap script, not a regenerator.** It cannot rebuild everything in `mixes.json`, and re-running it naively destroyed three things at once:
- **tracklists** (~1200 entries, pulled separately from YouTube descriptions — the script never emitted them at all)
- **the 5 newest mixes** (added by hand 2026-08-20; its hardcoded YouTube list doesn't include them)
- **date format** (it emitted `2020.05.15`; the DB needs `2020-05-15` for `date.fromisoformat`)

It now carries `tracklist` and hand-matched `soundcloudUrl` over from the existing file by slug, emits dashed dates, and **aborts without writing** if any mix in the existing file is missing from its run, printing which ones. Verified: re-running is now a no-op that reproduces the committed file byte-for-byte. Treat the abort as a real signal — it means the script's hardcoded inputs are behind the data.

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

### Email DNS (flagged by Cloudflare 2026-08-29, not launch-blocking)

`weebtrax.com` has no MX, SPF or DMARC records. Two separate issues:
- **No MX** — mail to `anything@weebtrax.com` bounces. Irrelevant today (the site references no email address at all), but blocks any future `contact@weebtrax.com` for the About section's Business Inquiries item.
- **No SPF/DMARC** — anyone can forge mail claiming to be from `@weebtrax.com`, and receiving servers can't tell. This damages the domain's reputation and is worth fixing even though the domain sends no mail. Two TXT records cover it: `@` → `v=spf1 -all` and `_dmarc` → `v=DMARC1; p=reject; rua=mailto:<a mailbox you read>`.
- **Caveat**: those records forbid *all* sending from the domain. If a newsletter/Mailchimp/contact-form sender is added later, they must be updated to authorise it or the mail will be rejected.

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
