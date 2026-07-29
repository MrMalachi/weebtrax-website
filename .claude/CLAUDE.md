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
- Serve with: `cd production && python3 serve.py` — use `serve.py`, NOT `python3 -m http.server 3000` (the built-in server crashes on dropped audio connections) and NOT `python3 -m serve.py` (module mode, wrong). `serve.py` uses `StableServer(ThreadingHTTPServer)` which silences `BrokenPipeError`/`ConnectionResetError` from Safari dropping audio streams mid-response, and installs `signal.SIG_IGN` for SIGTERM so zsh background-job management can't kill the process. Site must be served from `production/` — serving from the repo root causes `/public/assets/metadata/*.json` 404s and a BOOT FAILURE screen.

### Current features (as of 2026-07-21)
- **Archive**: 94 mixes, mood filter chips (right-aligned, above player), NEWEST/OLDEST/A-Z sort, 5-per-page pagination, active row player
- **Archive status line**: shows filtered file count only (e.g. `094 files`), not a fraction
- **Playback**: auto-advance to next track, keyboard shortcuts (Space/←/→), session restore via localStorage. Spacebar routes through `togglePlayRef` to avoid stale closure.
- **Audio fades**: 200ms fade-in via GainNode on all play paths; 15ms fade-out on pause to prevent click without causing position skip
- **Waveform**: Web Audio API AnalyserNode (`window.__WT_ANALYSER`) drives both oscilloscopes reactively; `window.__WT_ANALYSER` set on first play
- **Broadcast bar**: in `js/app.js` (`BroadcastBar` component, ~line 73) — NOT the `Ticker` component in `core.js` (that is dead/unused code). Separator is `·` (middle dot `\xB7`), rendered as a separate span at `fontSize: 15` inside a `loopedItems` array. Items and separators rendered as React elements (not a joined string) to allow independent sizing.
- **Broadcast bar play/pause button**: always-visible toggle (`wt-broadcast-play-btn`), present before any track is played. Fixed width (`isMobile ? 22 : 28`). Icon uses per-state font-size in a `<span>` — `▐▐` at 8/11px (smaller glyph weight), `▶` at 13/17px (larger) — to visually balance the two glyphs. Elapsed time hidden on mobile to save space. WIRED ACTIVITY connection speed removed from mobile ticker.
- **Background audio (2026-07-20)**: `visibilitychange` handler NEVER pauses audio or suspends AudioContext on `hidden` — music continues playing through lock screens, tab switches, window zoom/resize. On `hidden`: only cancels in-flight fade callbacks. On `visible`: syncs React state from audio ground truth (`audio.currentTime`, `audio.paused`) and calls `ctx.resume()` if iOS auto-suspended the AudioContext. `hideTimerRef` removed (debounce no longer needed). `pageshow` handler added for BFCache restore.
- **Lock screen controls (iOS)**: Media Session API registered in `app.js`. `play` calls `ctx.resume()` then `audio.play()`; `pause` cancels fades then calls `audio.pause()`; `seekTo/Forward/Backward` wired; `previoustrack`/`nexttrack` wired (navigate to adjacent mix via `activeTxIdRef` + `loadTrackRef`); metadata updated on track change with `artwork` (180/192/512px icons) and `album: 'WeebTrax Mix Archive'`; `playbackState` synced in `onPlay`/`onPause`.
- **PWA (2026-07-20)**: `production/manifest.json` (standalone, green theme, 3 icon sizes); `production/sw.js` (network-first cache, audio/video streams bypassed for byte-range compat); `icon-192.png` and `icon-512.png` added to `public/assets/images/`; `index.html` has manifest link, favicon links, apple-touch-icon, apple PWA meta tags, SW registration script.
- **iOS audio race condition — `fadeOutAbortRef`**: `fadeOut()` handles a suspended AudioContext by calling `ctx.resume().then(doSchedule)` — `doSchedule` runs asynchronously. If `fadeIn()` fires before `doSchedule` resolves, the old code cancelled `fadeOutTimerRef` (the setTimeout) but the timer hadn't been set yet, so nothing was cancelled. `doSchedule` then ran anyway, driving gain to 0 and calling `audio.pause()` mid-play (the "vinyl scratch"). Fix: `fadeOutAbortRef` holds an abort closure set at the start of each `fadeOut` and checked by `doSchedule` before executing. `fadeIn()`, `msPause()`, and the `visibilitychange` hide handler all call `fadeOutAbortRef.current()` before doing their own work.
- **`togglePlay` uses `audio.paused` not React state**: After a lock/unlock cycle, React `playing` state can be stale. `togglePlay` now reads `audio.paused` (ground truth on the DOM element) to decide whether to pause or play, avoiding stale-closure toggle inversions.
- **Mobile detection**: `useIsMobile()` hook defined in `sections1.js` uses `window.matchMedia(MOBILE_MQ)` where `MOBILE_MQ = '(max-width: 599px)'` — exactly matches the `<link media>` on `mobile.css`. All JS mobile branches use this hook. `<main>` marginLeft and BroadcastBar `left` use `isMobile ? 0 : railW` directly in JS rather than relying on CSS `!important` to override the inline style. Both have `transition: margin-left/left 0.2s ease` so the 48→112px rail expansion at 900px animates rather than snapping.
- **Responsive design philosophy**: Breakpoints are **width-only** — no orientation or device detection. Landscape phones (wide viewport) get the desktop layout. This prevents split-brain states where CSS and JS disagree. `mobile.css` loads only at `≤599px`; everything above is desktop CSS.
- **Responsive breakpoint system** (as of 2026-07-16):
  - `<600px` — mobile: `mobile.css` loads, rail hidden, bottom nav shows, `isMobile=true`
  - `600–899px` — compact desktop: rail `48px` (`compact = winW < 900`), tablet archive table (`36px 1fr 96px`), section padding `24px`, single-col footer, single-col submissions
  - `900px+` — full desktop: rail `112px`, 5-col archive table (mid: `40px 1fr 80px 90px 120px`), 3-col footer
  - `900–1100px` — section padding scales **fluidly** via `clamp()` rather than snapping: vertical `60→90px`, horizontal `24→56px`
  - `1100px+` — wide: section padding reaches max (`56px`), submissions goes 2-col, archive wide table (`48px 1fr 100px 108px 152px`)
  - `1200px+` — large: episode filter buttons enlarge to `11px` font
- **Rail compact threshold**: `compact = winW < 900` in `app.js`. The old `winW < 560` threshold was inside the mobile range where the rail is hidden by CSS, so it never fired at any visible desktop width. 900px means the compact (48px) rail is active from 600px to 899px.
- **Hero visual**: Lain Ken Burns image renders when `!isMobile` (not `winW >= 600`). Using `winW` (integer) vs CSS `max-width: 599px` could disagree by 1px at the boundary — `!isMobile` ties both to the same matchMedia signal so they can never fire simultaneously. At `winW < 1120`, opacity is `winW < 760 ? 0.35 : 0.55`.
- **Play/pause icon pattern**: all play/pause buttons wrap their icon in `React.createElement("span", { style: { fontSize: N, lineHeight: 1, marginRight: M } }, icon)` inside a `React.Fragment` with the label text. `playBtn` (archive rows, `sections2.js`) uses `display: inline-flex, alignItems: center` — no built-in gap, so `marginRight: 5` controls spacing. `Btn` component (`core.js`) already has `gap: 9` between flex children, so icon spans inside Btn use `marginRight: -4` to net ~5px visual gap. Hero CTA icon: `fontSize: 13, marginRight: -4`. Active player icon: `fontSize: playing?12:13, marginRight: -4` (pause bumped to 12 so `▐▐` matches the visual weight of `▶` at 13). Archive row icon: `fontSize: playing?8:12, marginRight: 5`.
- **Scenes**: 48 scenes, episode filter (EP 01–13, no EP 09 footage), 6-per-page pagination; grid uses `repeat(2, 1fr)` (fixed 2-per-row at ≥600px) with `max-width: 1100px` on `.wt-scene-grid` so cards cap at ~542px each on large viewports. Mobile (≤599px) keeps 2-per-row via mobile.css `aspect-ratio: 4/3`.
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
- **Mood chips**: horizontal scroll strip, no wrapping, hidden scrollbar, larger tap targets. `touch-action: pan-x pan-y` on `.wt-mood-chips` — `pan-y` is required (not just `pan-x`) so vertical page scroll still works when chips don't overflow horizontally at wider narrow viewports.
- **Episode filter scroll**: `.wt-ep-scroll` also gets `touch-action: pan-x pan-y; -webkit-overflow-scrolling: touch` for the same reason.
- **Archive status bar**: flex row — `094 files` pinned left, `sort: newest ↕` pinned right; path spans hidden
- **Active player**: metadata line (`TX-id · slug · date`) hidden; track title splits on `|` with `pre-line` whitespace — text after pipe moves to new line, pipe stays
- **Seekbar**: visual-drag pattern — local position state during drag, `audio.currentTime` only written on pointerdown + pointerup; `touchAction: 'none'` prevents browser scroll stealing. `SeekBar` accepts an optional `onDragProgress(frac | null)` callback fired on every pointermove (and null on release) so consumers can show a live preview time without seeking audio. `ActiveRow` uses this via `dragFrac` state + `displayElapsed = dragFrac !== null ? Math.round(dragFrac * totalSecs) : elapsed` — both the clock and the `curTrack` line update in real time during scrub. TRACK I.D. panel also live-highlights during scrub: `isCur` uses `displayElapsed`; `tracklistPanelRef` + `curTrackIdx` + `useEffect` auto-scroll the active entry into view (`behavior: 'smooth'` during natural playback, `'auto'`/instant during drag).
- **SignalFeed bottom bar**: red `×` close (left) + green `⊞/⊟` expand toggle (right) replace the old single close button
- **PREV/NEXT + ← → buttons**: `wt-page-btn` class; CSS `:active` gives instant subtle press feedback (opacity 0.55, faint green bg); no JS state, no transition lag
- **Kenburns** animation disabled; hero player card hidden; hero section auto-height
- **HOME hero head + caption**: floating head fragment (`hero-head-mobile.png`, `.wt-hero-head-mobile`, 68px wide) + Japanese caption "私は私よ。" (`.wt-hero-head-say`, 12px — this is the reference size other section captions should match) sit above "MODULE .00 // HOME"; `.wt-hero-text` has `padding-top: 100px` to clear the floating head (bottom edge ~99px) and caption (bottom edge ~117px). `#wt-index` uses `justify-content: flex-start` so text starts near the top with dead space falling below the CTA buttons (before the crowd image) rather than above MODULE .00.
- **Submit terminal replay**: the typewriter in the Submit section only plays once per page load on mobile (`useReplayOnHidden(onceOnly)` in `sections2.js`) instead of replaying every time the section scrolls back into view — replaying was regrowing the terminal box height and shoving About down. Desktop still replays on every revisit.
- **Character accent images** (Scenes `.wt-scenes-char-mobile`, Submit portrait `.wt-uplink-portrait-mobile` — Archive's was removed entirely): both sit **above** their section's title, right-edge-aligned with the title text, positioned via `left` (not `right`) so the fixed px position holds regardless of viewport width — `right` is relative to the container's right edge, which moves with viewport width, while title text is left-anchored at a fixed padding offset so its right edge is constant in absolute px (as long as the title stays single-line; both titles wrap at width <~340-360px, which breaks this assumption — acceptable given real target devices are ≥360px). **Gotcha**: source PNGs can carry a lot of transparent padding — always check the alpha-channel content bounds (not just the `<img>` box) before computing an "edge-aligned" position, since the visible character can fall well short of the element's own bounding box.
- **Button click feedback**: SUBMIT YOUR MUSIC and COPY SUBMISSION LINK (`sections2.js`, `Submissions()`) both flash green briefly on tap then revert. **Gotcha**: when overriding a style property in a conditional flash state that reverts to `{}`, always match the *same* CSS property form (shorthand vs longhand) the base component style uses — e.g. the base `Btn` style sets `border` (shorthand); overriding with `borderColor` (longhand) in the flash state left the border a broken default color after React removed the longhand key on revert, since clearing a longhand doesn't restore the shorthand's original value.
- **Mobile `:hover` sticky-state bug**: `.wt-btn-ghost:hover` / `.wt-btn-primary:hover` / `.wt-flink:hover` in `styles.css` are wrapped in `@media (hover: hover)` — without this, tapping a button on a touch device enters `:hover` and never leaves it (no mouse to fire a "leave" event), so buttons got stuck looking hover-highlighted after every tap. Any new hover-only style added to this codebase should go inside that same media query.
- **Clipboard copy over plain HTTP**: `navigator.clipboard` requires a secure context (HTTPS or `localhost`) — testing over a local network IP like `http://192.168.x.x` leaves it `undefined`, and calling `.writeText` on it throws *synchronously*, before any `.then/.catch` runs. Both copy buttons now go through a shared `copyToClipboard()` helper (top of `sections2.js`) that falls back to a hidden-textarea + `execCommand('copy')` when the modern API isn't available.
- **About section** (mobile only): "// TRANSMISSION" blurb and the entire "// NAV" block (links + collapsible header) were removed — NAV duplicated the always-visible bottom nav bar. "// SOCIAL SIGNALS" stays visible (unique links, not shown elsewhere). `BUSINESS_INQUIRIES` button uses smaller padding/font on mobile than desktop.
- **Mobile margin/layout via JS not CSS**: `<main>` marginLeft and BroadcastBar `left` are set as `isMobile ? 0 : railW` in `app.js`. Do NOT rely solely on `main { margin-left: 0 !important }` in `mobile.css` to fix the inline style — if the CSS is stale-cached the layout breaks. Source of truth is the JS.
- **`overflow-x: hidden` on `html`/`body` blocks child scroll on iOS**: Setting `overflow-x: hidden` on `<html>` or `<body>` makes iOS Safari apply it to the viewport scroll container, which prevents touch-driven horizontal scroll in ALL child elements (mood chips, ep filter, etc.). Do NOT add `overflow-x: hidden` to `html` or `body` in `mobile.css`. Layout overflow prevention must come from `max-width: 100%` on those elements and JS-controlled margins — not from overflow clipping on the root.
- **Archive status bar at 600–899px**: uses the flex-row layout (file count left, sort right) via `(isMobile || tablet)` condition — same as ≤599px mobile. The `wt-statusbar-path` spans (`~/weebtrax/transmissions/`) are also hidden at this width via `@media (min-width: 600px) and (max-width: 899px) { .wt-statusbar-path { display: none } }` in `styles.css`. Both changes ensure the status bar starts flush-left aligned with the "Latest Transmissions" title.
- **React hooks rule — early returns**: never place a hook call after a conditional `return`. If a component has `if (condition) return null`, ALL `useState`/`useEffect`/`useRef`/custom hooks must be called before that line. Violating this causes "Rendered fewer hooks than expected" when the condition flips. Fixed in `TermPageBar` (sections2.js) — `useIsMobile()` was after the guard.
- **Icon vertical alignment in buttons**: use `display: inline-flex; align-items: center` on the button element rather than `verticalAlign: middle` on the icon span. `verticalAlign` on an inline span aligns against the text baseline (unreliable for Unicode block chars like `▐▐`); flex `alignItems: center` is the correct tool.
- **Btn gap + icon marginRight**: `Btn` (core.js) has `gap: 9` between flex children. Icon spans inside Btn use `marginRight: -4` so the net visual gap is ~5px. Buttons that do NOT use the Btn component (e.g. `playBtn` archive rows) have no built-in gap, so use `marginRight: 5` directly.

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
- [x] Show tracklist in the active player card — `curTrack` derived in `ActiveRow` by scanning `t.tracklist` in reverse for the last entry where `elapsed >= e.timeSecs`; renders `▸ Artist — Title` line between the mix title and controls; `fontSize` scales `clamp(10px → 12px)` from 900→1400px on desktop, fixed 10px on mobile/compact; only renders when tracklist data exists (2 mixes without tracklists show nothing)

### Scenes
- [x] Prev/next scene navigation within the video player — ← → buttons with disabled state at boundaries; fullscreen stays open on nav
- [x] Scene card thumbnails — `repeat(2, 1fr)` fixed 2-per-row with `max-width: 1100px` on the grid; `aspect-ratio: 4/3` on cards

### Archive
- [x] Wide table layout — tablet (600–899px) gets 3-col, mid (900–1199px) gets 5-col, wide (1200px+) gets 5-col with wider columns; slug (`t.file`) font size is `tablet ? 9 : 12` — 9px at 600–899px so landscape-phone slugs don't appear oversized in the wide 1fr column, 12px at ≥900px; title font size `(mid || tablet) ? 16 : 17` — bumps to 17px at ≥1200px to fill the wider 1fr column
- [x] Mood filter chips and sort control wrap awkwardly on some screen sizes — fixed (2026-07-21): MOOD: label inline with chips, `flex: 0 0 auto` prevents squash, `overflow-x: auto` for scroll on tiny screens, `letter-spacing: 1px`; at 600–1099px TRACK I.D. drops below LISTEN via CSS `flex-basis: 100%` + `order: -1`; nowrap threshold raised to `winW < 1100`

### Data gaps
- [ ] Ghetto Symphony Pt. 1 (`mix-046`) and Pt. 2 (`mix-075`) have no tracklist — add manually if descriptions available

### Performance
- [x] `js/images.js` (314KB base64 image data in `window.WT_IMG`) is **not loaded** in `index.html` — images are served via direct file paths in JS (`public/assets/images/...`). The file is an orphan artifact and the synchronous-load concern is moot. No action needed.

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
- [x] TRACK I.D. toggle + ActiveRow layout refactor (2026-07-22/23) — `ActiveRow` returns a `React.Fragment` containing (1) the card div and (2) a tracklist sibling div rendered after the card. Card layout: CSS grid `oscColW px 1fr`; left col = oscilloscope + seekbar + elapsed/duration row (all widths); right col = status + title + `curTrack` line + controls column. Controls use a 3-way ternary: **mobile** → flex row with LISTEN+TRACK I.D. in a centered column (`alignItems: center`) left, YOUTUBE and SOUNDCLOUD stacked in a flex-column to the right (SOUNDCLOUD directly underneath YOUTUBE) — TRACK I.D. is horizontally centered under LISTEN; **narrow** (600–899px) → same 2-col but `alignItems: flex-start` with `marginTop: 10`; **desktop** (≥900px) → flex-column, LISTEN|YT|SC row then TRACK I.D. below (`marginTop: 6, marginLeft: 0`). `mobile.css` keeps `min-height: 28px` for touch target only. VolBar removed from player card entirely.
- [x] Hero crowd image: 180px height, `object-fit: cover`, `mask-image` edge fade on all 4 sides, `bottom: -8px` so crowd emerges from section border, bottom dissolve starts at 55%
- [x] Submit terminal no longer regrows/replays every time the section scrolls back into view
- [x] About section decluttered — removed redundant NAV block and TRANSMISSION blurb, shrunk oversized Business Inquiries button
- [x] Fixed buttons getting stuck in a hover-highlighted state after tapping (sticky `:hover` on touch — scoped hover styles to `@media (hover: hover)`)
- [x] Fixed clipboard copy silently failing when testing over plain HTTP / local network IP (added `execCommand` fallback)
- [x] Broadcast bar play/pause toggle — always visible before and during playback; elapsed time counter hidden on mobile; WIRED ACTIVITY / connection-speed item removed from mobile ticker; ON AIR nudged left via `padding-left: 8px` on broadcast bar inner div
- [x] NODE.227 and `wired://weebtrax —` prefix removed from About section footer on mobile (`.wt-node-label, .wt-wired-prefix { display: none; }` in `mobile.css`); both remain on desktop
- [x] Landscape orientation — **orientation detection removed entirely** (2026-07-16). `mobile.css` now loads only at `max-width: 599px` (no orientation clause). `MOBILE_MQ` in `sections1.js` matches. Landscape phones (wide viewport ~956px) use the desktop layout. Eliminates the split-brain state where CSS said "mobile" and JS saw a desktop-width viewport simultaneously. The old `@media (orientation: landscape)` compact-layout block in `mobile.css` is still present as a sub-query inside the `≤599px` load context, so narrow-and-landscape edge cases (small tablets) still get compact overrides.
- [x] Mobile horizontal overflow fixed — `<main>` and BroadcastBar use `isMobile ? 0 : railW` in JS (`app.js`) rather than relying on `main { margin-left: 0 !important }` CSS override; `mobile.css` also adds `overflow-x: hidden !important; max-width: 100%` to `html, body` and `main`
- [x] React hooks error in Scenes section (`TermPageBar`) — `useIsMobile()` was called after `if (total <= 1) return null` early return; moved above the guard so hook count is always consistent
- [x] iOS timer drift — `visibilitychange` hide now calls `audio.pause()` explicitly; `onPause` fires → `setPlaying(false)` and `timeupdate` stops, so elapsed time freezes when phone is locked instead of silently advancing
- [x] iOS vinyl scratch after lock/unlock — added `fadeOutAbortRef` abort flag; `doSchedule` (async, runs after `ctx.resume()` resolves) checks the flag before executing so a `fadeIn()` call can cancel it even before the timeout is set
- [x] Width-based responsive design overhaul (2026-07-16) — removed all orientation/device detection; pure viewport-width breakpoints at 600 / 900 / 1100 / 1200px; rail compact threshold raised from `winW < 560` → `winW < 900` so compact rail (48px) actually activates at 600–899px; hero Lain image threshold raised from `winW >= 480` → `winW >= 600` to close the mixing zone
- [x] Section padding expansion moved from 900px → 1100px so rail expansion (at 900px) and padding expansion don't both fire at once — only ~63px width swing at 900px instead of ~127px
- [x] Footer single-col until 900px (was 720px — landscape phone viewport of ~956px wrongly triggered 3-col)
- [x] Submit button icon changed from `►` + trailing `↗` to `▲` — `"▲ SUBMIT YOUR MUSIC"` in the Track Submissions section (`sections2.js`)
- [x] Hero dead space — `#wt-index` mobile layout reworked (2026-07-16): switched to `justify-content: flex-start` + `padding-top: 100px` on `.wt-hero-text` so dead space falls below the CTA buttons rather than above MODULE .00 (previous `center` approach put a layout-gap-looking space above the heading)
- [x] Mood chips: `justify-content: space-between` → `flex-start` + `gap: 8px` for consistent uniform spacing regardless of chip count or overflow state
- [x] iOS touch scroll unblocking — mood chips and episode filter got `touch-action: pan-x pan-y` so vertical page scroll isn't captured when the container doesn't overflow horizontally
- [x] Fluid section padding — Archive, Submit (`sections2.js`) and Scenes (`sections1.js`) padding now uses `clamp()` with `vw` units so padding scales smoothly from 900→1100px instead of snapping; `<main>` and BroadcastBar have `transition: margin-left/left 0.2s ease` to animate the rail width change
- [x] "SELECTED SIGNAL ↓" label hidden on mobile — added `className: 'wt-signal-label-row'` to the wrapper div (`sections1.js`), hidden via `mobile.css`
- [x] NODE.227 rail footer (2026-07-22) — pulse dot + NODE.227 label hidden entirely at compact widths (`!compact &&` guard on the footer div in `sections1.js`); visible only at full desktop (≥900px) at fixed size (7px dot, 8.5px font). Previously they scaled down at compact — now they simply don't render.
- [x] Hero status bar / hero text overlap in narrow mode (2026-07-17) — `#wt-index` gets `paddingTop: 80` when `narrow` (`winW < 1120`) so hero text never collides with the absolute status bar at `top: 32`
- [x] Hero bar status: ONLINE moved to left side on mobile (2026-07-17) — removed `position: absolute` override from mobile.css; element stays in natural flex-row; `margin-top: -12px` fine-tunes vertical alignment to match desktop bar level
- [x] Clock on right side of mobile hero bar (2026-07-17) — right-side div always rendered (`display: 'flex'`); `⌁ 44.1kHz` hidden on mobile (`!isMobile &&`) to avoid crowding Lain's face; clock gets `textShadow: '0 1px 6px rgba(0,0,0,0.95), 0 0 12px rgba(0,0,0,0.8)'` on mobile so it reads against the dark image background; color raised to `WT2.body` on mobile
- [x] Lain + mobile-head dual-image fix (2026-07-17) — Lain visual condition changed from `winW >= 600 &&` to `!isMobile &&`; eliminates 1px rounding boundary where CSS saw ≤599px (mobile head visible) while JS saw `winW=600` (Lain also rendered simultaneously)
- [x] Hero CTA buttons stacked + centered on mobile (2026-07-17) — mobile.css `.wt-hero-cta` gets `flex-direction: column; align-items: center` so SUBMIT YOUR TRACK sits under LISTEN TO THE LATEST MIX; buttons keep natural content width (not stretched)
- [x] Archive ACTION column fix (2026-07-20) — wide table `gridTemplateColumns` had only 5 columns but rendered 6 items; ACTION badge was wrapping below the FILE name. Fixed by adding a 6th column: `'48px 1fr 100px 108px 120px 120px'`
- [x] Oscilloscope smooth scaling (2026-07-20) — height and column width now computed in JS (`oscH`, `oscColW`) so they scale continuously: mobile 72→88px (320→600px), tablet 88→108px (600→900px), desktop 108→124px (900→1400px); column 200→280px (tablet), 280→380px (desktop). `VolBarV` receives numeric `oscHeight` (required for its `Math.floor(...)` arithmetic). Layout switches from `flex` to `grid` at `!mobile` (not `!narrow`) so the oscilloscope column shows at tablet widths.
- [x] Mood chip fluid scaling (2026-07-20) — label and chips use `clamp()` CSS values at `>899px`: font 10→11px, padding 3→4px vertical / 9→13px horizontal; anchored right in the filter bar
- [x] TRACK I.D. desktop nowrap (2026-07-20/21) — superseded by column-layout refactor (see above); controls are now a flex column so LISTEN and secondary row (with TRACK I.D.) never compete for horizontal space
- [x] Background audio / PWA upgrade (2026-07-20) — see features section above
- [x] Mood chips mobile UX (2026-07-21) — MOOD: label rendered inline with chips as a non-shrinking flex item; chips use `flex: 0 0 auto` (never squash); `overflow-x: auto` + hidden scrollbar + `touch-action: pan-x pan-y`; `letter-spacing: 1px` (reduced from 1.5) so all 5 chips + label fit single-row at ≥375px without scrolling
- [x] Archive row mobile date spacing (2026-07-21) — `marginLeft: 10` on the date span (`t.date`) in the mobile row flex container gives 18px total separation between run time and release date vs 8px between other items; makes them clearly distinct at a glance (`sections2.js` v83)
- [x] Archive row mobile time/date right-aligned (2026-07-21) — `marginLeft: auto` on `t.run` pushes both run time and date to the right edge of the flex row, aligning date with track title above; YT link gets `marginLeft: 8` to visually group YT/SC together away from PLAY (`sections2.js` v85)
- [x] Status bar path hidden at 600–899px (2026-07-21) — `~/weebtrax/transmissions/` path spans hidden at compact desktop / landscape phone widths via `@media (600–899px)` in `styles.css` (`v47`); avoids the path looking oversized at landscape phone viewports
- [x] Mood chip scroll on iOS (2026-07-21) — root cause: `overflow-x: hidden` on `html, body` in `mobile.css` was applying to the iOS Safari viewport, blocking horizontal touch-scroll in ALL child containers. Removed. Overflow prevention now relies on `max-width: 100%` + JS margins only.
- [x] Oscilloscope visual weight normalized (2026-07-21) — archive `ActiveRow` oscilloscope now passes `strokeWidth = 160 / oscH` and `shadowBlur = 720 / oscH` so the visual line weight matches the hero oscilloscope at all widths (hero reference: `height: 80, strokeWidth: 2.0, shadowBlur: 9`). Both props tracked via refs (`strokeWidthRef`, `shadowBlurRef`) inside `Oscilloscope` so the draw loop picks up resize changes without restarting. Mobile keeps fixed `strokeWidth: 2.5, shadowBlur: 9`.
- [x] NODE.227 rail footer gap (2026-07-21) — gap between pulse dot and NODE.227 label set to `16` at all desktop widths (was `compact ? 6 : 9`); 16px gives the 8px glow room to clear before the text starts; consistent across compact and full rail.
- [x] Footer social signals spacing (2026-07-22) — narrow branch (`winW < 900`) social signals grid: `gap: winW < 600 ? '0 20px' : '10px 20px'` (row gap 10px at 600–899px, 0 at ≤599px); `marginTop: (winW < 600 && i >= 2) ? -12 : 0` on Instagram/TikTok items (negative margin only at ≤599px where `min-height: 44px` touch targets from `mobile.css` create extra row space).

**Still to do:**

*Archive*
- [ ] Previous track button — auto-advance goes forward only, no way to go back
- [ ] Shuffle mode — random track selection

*Scenes / fullscreen*
- [x] "SELECTED SIGNAL: ..." label above the scene grid — hidden on mobile via `wt-signal-label-row` class + `mobile.css`

*Hero section*
- [x] Hero sparse on mobile — reworked to `flex-start` + `padding-top: 100px` on `.wt-hero-text`; dead space now falls below CTAs (breathing room) rather than above the heading

*General*
- [ ] Remaining small touch targets: COLLAPSE/DISCONNECT buttons in video player (`6px 10px` padding), pagination page-number buttons (`5px 8px`)
- [x] Landscape orientation — CSS + JS now use same media query; compact layout applied via `@media (orientation: landscape)` in `mobile.css`
- [ ] Overall mobile layout is still CSS overrides on desktop structure — a first-class mobile layout pass would improve spacing, typography scale, and section rhythm
- [ ] **iOS Safari overscroll grey reveal** — when rubber-banding past the top or bottom of the page, iOS exposes a grey system canvas behind the `#0a0b0e` background. Current fix is `html { overscroll-behavior-y: contain; }` which prevents bounce-chaining but does not fully eliminate the reveal. Attempted fixes that failed: `color-scheme: dark` on `html`; `theme-color: #0a0b0e`; `body::before` pseudo-element pinned at `top: -50vh`; `min-height: 100svh` + negative `margin-top`; `body { position: fixed; overflow: hidden }` with `main` as scroll container (broke `window.scrollY` / `window.scrollTo()` / all JS scroll listeners). A correct fix requires either (a) moving scroll ownership entirely to `<main>` and rewriting all JS scroll APIs to target that element, or (b) a future iOS/Safari version respecting `html { background-color }` in the overscroll zone.

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
