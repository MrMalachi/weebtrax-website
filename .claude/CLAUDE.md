# WeebTrax — Project Roadmap

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | Local media organization | ✅ Complete |
| 2 | JSON metadata | ✅ Complete |
| 3 | Website reads JSON | ✅ Complete |
| 3.5 | Countdown page (pre-launch holding page) | ✅ Live |
| 4 | Create backend / API (FastAPI) | 🟨 In progress — `backend/` scaffolded, reads from JSON |
| 5 | Move JSON metadata into PostgreSQL | ⬜ Not started |
| 6 | Deploy with Railway | ⬜ Not started |
| 7 | Move large media to storage bucket (Cloudflare R2) | ⬜ Not started |
| Pre-launch | Verification, Cloudflare config, launch procedure | ⬜ Not started |

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
- Serve with: `cd production && python3 -m http.server 3000` (site now lives under `production/`, not the repo root — serving from the wrong directory causes `/public/assets/metadata/*.json` 404s and a BOOT FAILURE screen)

### Current features (as of 2026-07-11)
- **Archive**: 94 mixes, mood filter chips (right-aligned, above player), NEWEST/OLDEST/A-Z sort, 5-per-page pagination, active row player
- **Archive status line**: shows filtered file count only (e.g. `094 files`), not a fraction
- **Playback**: auto-advance to next track, keyboard shortcuts (Space/←/→), session restore via localStorage. Spacebar routes through `togglePlayRef` to avoid stale closure.
- **Audio fades**: 200ms fade-in via GainNode on all play paths; 15ms fade-out on pause to prevent click without causing position skip
- **Waveform**: Web Audio API AnalyserNode (`window.__WT_ANALYSER`) drives both oscilloscopes reactively; `window.__WT_ANALYSER` set on first play
- **Broadcast bar**: in `js/app.js` (`BroadcastBar` component, ~line 73) — NOT the `Ticker` component in `core.js` (that is dead/unused code). Separator is `·` (middle dot `\xB7`), rendered as a separate span at `fontSize: 15` inside a `loopedItems` array. Items and separators rendered as React elements (not a joined string) to allow independent sizing.
- **Scenes**: 48 scenes, episode filter (EP 01–13, no EP 09 footage), 6-per-page pagination; grid uses `repeat(auto-fill, minmax(300px, 1fr))` for responsive card sizing
- **Scene player** (`SignalFeed`): Wired/Navi aesthetic — `WIRED://NODE.227` header, click-to-toggle video, flash icon, fullscreen mode (scroll-locked), mobile responsive (<600px); corner labels (`NODE.227`, `EP.XX`, timecode) offset `22/26px` from edges for breathing room from `FrameTicks` brackets; prev/next scene navigation with disabled state at boundaries; closing fullscreen does NOT trigger on prev/next (key prop removed from SignalFeed)
- **Hero text bar**: repositioned to `top: 32, left/right: 36` to match video player corner offset ratio (`inset: 22` + 10/14px breathing room)
- **Rail WT logo**: hover state — accent border glow, corner ticks expand 6→9px, WT text bloom, `// WEEBTRAX` label slides in to the right; click scrolls to top
- **About section**: "FROM CLUB CYBERIA"; footer bar reads "LET THERE BE HOUSE" (was "STATUS: ONLINE"); subtitle "Producers — transmit your signal into The Wired"
- **Visibility**: `WT2` text opacity raised — `body` 0.72→0.86, `dim` 0.5→0.64, `faint` 0.3→0.44; `line` 0.14→0.20, `line2` 0.28→0.38
- **Error boundary**: wraps `<App>`, crashes show a readable message instead of blank screen
- **Deleted**: `js/utils.js`, `js/main.js`, `src/` directories, dead `FeatureModule` component

#### Mobile-specific features (`css/mobile.css`, loaded only at ≤599px)
- **Bottom nav bar** (`MobileNav` in `sections1.js`): fixed 5-tab bar — Home / Archive / Scenes / Submit / About; accent dot on active section; smooth scroll via `window.scrollTo({ top: el.offsetTop })`
- **Oscilloscope**: compact height (60px vs 110px desktop), strokeWidth 2.5; VolBar hidden
- **Mood chips**: horizontal scroll strip, no wrapping, hidden scrollbar, larger tap targets
- **Archive status bar**: flex row — `094 files` pinned left, `sort: newest ↕` pinned right; path spans hidden
- **Active player**: metadata line (`TX-id · slug · date`) hidden; track title splits on `|` with `pre-line` whitespace — text after pipe moves to new line, pipe stays
- **Seekbar**: visual-drag pattern — local position state during drag, `audio.currentTime` only written on pointerdown + pointerup; `touchAction: 'none'` prevents browser scroll stealing
- **SignalFeed bottom bar**: red `×` close (left) + green `⊞/⊟` expand toggle (right) replace the old single close button
- **PREV/NEXT + ← → buttons**: `wt-page-btn` class; CSS `:active` gives instant subtle press feedback (opacity 0.55, faint green bg); no JS state, no transition lag
- **Kenburns** animation disabled; hero player card hidden; hero section auto-height
- **HOME hero head + caption**: floating head fragment (`hero-head-mobile.png`, `.wt-hero-head-mobile`, 68px wide) + Japanese caption "私は私よ。" (`.wt-hero-head-say`, 12px — this is the reference size other section captions should match) sit above "MODULE .00 // HOME"; `.wt-hero-text` has extra top padding (56px) specifically to keep clearance from these floating elements, separate from the section's own padding
- **Submit terminal replay**: the typewriter in the Submit section only plays once per page load on mobile (`useReplayOnHidden(onceOnly)` in `sections2.js`) instead of replaying every time the section scrolls back into view — replaying was regrowing the terminal box height and shoving About down. Desktop still replays on every revisit.
- **Character accent images** (Scenes `.wt-scenes-char-mobile`, Submit portrait `.wt-uplink-portrait-mobile` — Archive's was removed entirely): both sit **above** their section's title, right-edge-aligned with the title text, positioned via `left` (not `right`) so the fixed px position holds regardless of viewport width — `right` is relative to the container's right edge, which moves with viewport width, while title text is left-anchored at a fixed padding offset so its right edge is constant in absolute px (as long as the title stays single-line; both titles wrap at width <~340-360px, which breaks this assumption — acceptable given real target devices are ≥360px). **Gotcha**: source PNGs can carry a lot of transparent padding — always check the alpha-channel content bounds (not just the `<img>` box) before computing an "edge-aligned" position, since the visible character can fall well short of the element's own bounding box.
- **Button click feedback**: SUBMIT YOUR MUSIC and COPY SUBMISSION LINK (`sections2.js`, `Submissions()`) both flash green briefly on tap then revert. **Gotcha**: when overriding a style property in a conditional flash state that reverts to `{}`, always match the *same* CSS property form (shorthand vs longhand) the base component style uses — e.g. the base `Btn` style sets `border` (shorthand); overriding with `borderColor` (longhand) in the flash state left the border a broken default color after React removed the longhand key on revert, since clearing a longhand doesn't restore the shorthand's original value.
- **Mobile `:hover` sticky-state bug**: `.wt-btn-ghost:hover` / `.wt-btn-primary:hover` / `.wt-flink:hover` in `styles.css` are wrapped in `@media (hover: hover)` — without this, tapping a button on a touch device enters `:hover` and never leaves it (no mouse to fire a "leave" event), so buttons got stuck looking hover-highlighted after every tap. Any new hover-only style added to this codebase should go inside that same media query.
- **Clipboard copy over plain HTTP**: `navigator.clipboard` requires a secure context (HTTPS or `localhost`) — testing over a local network IP like `http://192.168.x.x` leaves it `undefined`, and calling `.writeText` on it throws *synchronously*, before any `.then/.catch` runs. Both copy buttons now go through a shared `copyToClipboard()` helper (top of `sections2.js`) that falls back to a hidden-textarea + `execCommand('copy')` when the modern API isn't available.
- **About section** (mobile only): "// TRANSMISSION" blurb and the entire "// NAV" block (links + collapsible header) were removed — NAV duplicated the always-visible bottom nav bar. "// SOCIAL SIGNALS" stays visible (unique links, not shown elsewhere). `BUSINESS_INQUIRIES` button uses smaller padding/font on mobile than desktop.

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
- [x] Prev/next scene navigation within the video player — ← → buttons with disabled state at boundaries; fullscreen stays open on nav
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

### Mobile

Mobile has a working bottom nav bar and several archive/player polish passes. Core UX is functional; remaining work is refinement and layout.

**Done:**
- [x] Fixed bottom nav bar (Home / Archive / Scenes / Submit / About), accent dot on active section
- [x] Compact oscilloscope (60px, strokeWidth 2.5), VolBar hidden
- [x] Mood chips horizontal scroll strip
- [x] Right mood chip fade (`wt-ep-fade-hint`) now hides when scrolled to DEEP (moodFadeRightRef + onScroll check)
- [x] Archive status bar: flex row (file count left, sort right)
- [x] Archive table mid-width breakpoint — tablet (600–900px) gets 3-column layout
- [x] Active player metadata line hidden
- [x] Track title pipe `|` → line break (text after pipe moves to new line)
- [x] Seekbar visual-drag pattern (no stuck drag on touch)
- [x] SignalFeed bottom bar: red × close + green ⊞/⊟ expand
- [x] PREV/NEXT + ← → instant press feedback via CSS :active
- [x] Fullscreen video controls auto-hide after 3 seconds (tap to reveal); COLLAPSE/DISCONNECT move to bottom-left in landscape
- [x] Scene card thumbnails enlarged via `aspect-ratio: 4/3 !important`
- [x] Scene character accent image removed from DOM (file preserved at `public/assets/images/scenes-char-mobile.png` at 771×503px)
- [x] Episode filter buttons (EP 01–13): 44px min-height touch target (`wt-ep-scroll button`)
- [x] TRACK I.D. toggle: `wt-tracklist-toggle` class, larger font (11px), left-aligned with LISTEN via flex line-break div (`wt-tracklist-break`), position nudged up/left (`margin-top: -22px`, `margin-left: -8px`)
- [x] Hero crowd image: 180px height, `object-fit: cover`, `mask-image` edge fade on all 4 sides, `bottom: -8px` so crowd emerges from section border, bottom dissolve starts at 55%
- [x] Submit terminal no longer regrows/replays every time the section scrolls back into view
- [x] About section decluttered — removed redundant NAV block and TRANSMISSION blurb, shrunk oversized Business Inquiries button
- [x] Fixed buttons getting stuck in a hover-highlighted state after tapping (sticky `:hover` on touch — scoped hover styles to `@media (hover: hover)`)
- [x] Fixed clipboard copy silently failing when testing over plain HTTP / local network IP (added `execCommand` fallback)

**Still to do:**

*Archive*
- [ ] Previous track button — auto-advance goes forward only, no way to go back
- [ ] Shuffle mode — random track selection

*Scenes / fullscreen*
- [ ] "SELECTED SIGNAL: ..." label above the scene grid doesn't serve much purpose on mobile since the player is right below it

*Hero section*
- [ ] Hero feels sparse on mobile after hiding player card and tagline — crowd image partially addresses this but upper half is mostly empty

*General*
- [ ] Remaining small touch targets: COLLAPSE/DISCONNECT buttons in video player (`6px 10px` padding), pagination page-number buttons (`5px 8px`)
- [ ] No landscape orientation handling — rotated phone likely looks broken
- [ ] Overall mobile layout is still CSS overrides on desktop structure — a first-class mobile layout pass would improve spacing, typography scale, and section rhythm

### Merch / Monetization
- [ ] Set up merch store (Printful/Printify print-on-demand) — can launch as sole proprietor, doesn't require the LLC or 50k-subscriber label milestone
- [ ] Add merch link/section to site nav or footer, matching Wired/Navi branding
- [ ] Decision (2026-07-09): merch goes live *before* record-label formation — reinforces brand and tests revenue early; reassigning the store to the LLC later is low-friction

---

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
- **Tab favicon**: `countdown/images/favicon-pylon.svg` — SVG of SEL-inspired power line transmission tower (#18 design). Uses `currentColor` + `prefers-color-scheme` media query: green `#8fbf9f` in dark mode, near-black `#1a1a1a` in light mode. glow filter applied to `<g>`. 3 widening cross-arms, diagonal braces, insulator circles at arm ends, drooping catenary wire curves, ground anchor. viewBox 0 0 96 96. macOS/iOS "Auto Appearance" switches this at sunrise/sunset automatically.
- **New tab / bookmark icon**: `countdown/images/apple-touch-icon-pylon.png` — 180×180 PNG, `#0d0d0d` background, generated from the SVG via qlmanage + Pillow.
- **Regenerating icons**: render `favicon-pylon.svg` via `qlmanage -t -s 180 -o /tmp/out/ favicon-pylon.svg`, then composite onto `#0d0d0d` canvas with Pillow. Always bump the `?v=N` cache-buster in the `<link>` tags after regenerating.

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

---

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
