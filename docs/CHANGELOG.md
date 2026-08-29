# WeebTrax — Build History

Dated changelog of completed work, moved out of `.claude/CLAUDE.md` (2026-08-28) to keep that file
lean — it's auto-loaded into every Claude Code session, and this history doesn't need to be. This
file is not auto-loaded; reference it when you need the detailed "why" behind a past fix.

---

## Phase 1 — Local media organization

### Checklist (complete)
- [x] Slugify MP3 filenames on flash drive (Mixes folders)
- [x] Slugify WAV filenames in Mastered folder
- [x] Organize mix audio files into `public/assets/mixes/audio/`
- [x] Organize mix thumbnails into `public/assets/scenes/thumbnails/` (user-selectable)
- [x] Organize scene MP4 clips into `public/assets/scenes/videos/`
- [x] Organize scene thumbnails into `public/assets/scenes/thumbnails/`

---

## Phase 3 — Website reads JSON

### What was done
- Unbundled the Claude Artifact `index.html` into separate files: `js/react.js`, `js/react-dom.js`, `js/images.js`, `js/tweaks-panel.js`, `js/core.js`, `js/sections1.js`, `js/sections2.js`, `js/app.js`, `css/styles.css`
- `app.js` pre-fetches both JSONs via `Promise.all([fetch(...), fetch(...)])` before mounting React, storing results in `window.__WT_MIXES` and `window.__WT_SCENES`
- `sections2.js` — `getMixes()` transforms `window.__WT_MIXES` entries; all 94 mixes render with mood filter, sort, and pagination
- `sections1.js` — `SceneGrid` renders all 48 scenes with episode filter, scene player, and pagination
- Mood→accent color mapping: `chill→blue`, `nostalgic→purple`, `dirty→red`, `deep→green`

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
- **Button click feedback**: SUBMIT YOUR MUSIC and COPY SUBMISSION LINK (`sections2.js`, `Submissions()`) both flash green briefly on tap then revert.
- **About section** (mobile only): "// TRANSMISSION" blurb and the entire "// NAV" block (links + collapsible header) were removed — NAV duplicated the always-visible bottom nav bar. "// SOCIAL SIGNALS" stays visible (unique links, not shown elsewhere). `BUSINESS_INQUIRIES` button uses smaller padding/font on mobile than desktop.
- **Archive status bar at 600–899px**: uses the flex-row layout (file count left, sort right) via `(isMobile || tablet)` condition — same as ≤599px mobile. The `wt-statusbar-path` spans (`~/weebtrax/transmissions/`) are also hidden at this width via `@media (min-width: 600px) and (max-width: 899px) { .wt-statusbar-path { display: none } }` in `styles.css`. Both changes ensure the status bar starts flush-left aligned with the "Latest Transmissions" title.
- **Icon vertical alignment in buttons**: use `display: inline-flex; align-items: center` on the button element rather than `verticalAlign: middle` on the icon span. `verticalAlign` on an inline span aligns against the text baseline (unreliable for Unicode block chars like `▐▐`); flex `alignItems: center` is the correct tool.
- **Btn gap + icon marginRight**: `Btn` (core.js) has `gap: 9` between flex children. Icon spans inside Btn use `marginRight: -4` so the net visual gap is ~5px. Buttons that do NOT use the Btn component (e.g. `playBtn` archive rows) have no built-in gap, so use `marginRight: 5` directly.

### Checklist (complete)
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

### Playback
- [x] Show tracklist in the active player card — `curTrack` derived in `ActiveRow` by scanning `t.tracklist` in reverse for the last entry where `elapsed >= e.timeSecs`; renders `▸ Artist — Title` line between the mix title and controls; `fontSize` scales `clamp(10px → 12px)` from 900→1400px on desktop, fixed 10px on mobile/compact; only renders when tracklist data exists (2 mixes without tracklists show nothing)

### Scenes
- [x] Prev/next scene navigation within the video player — ← → buttons with disabled state at boundaries; fullscreen stays open on nav
- [x] Scene card thumbnails — `repeat(2, 1fr)` fixed 2-per-row with `max-width: 1100px` on the grid; `aspect-ratio: 4/3` on cards

### Archive
- [x] Wide table layout — tablet (600–899px) gets 3-col, mid (900–1199px) gets 5-col, wide (1200px+) gets 5-col with wider columns; slug (`t.file`) font size is `tablet ? 9 : 12` — 9px at 600–899px so landscape-phone slugs don't appear oversized in the wide 1fr column, 12px at ≥900px; title font size `(mid || tablet) ? 16 : 17` — bumps to 17px at ≥1200px to fill the wider 1fr column
- [x] Mood filter chips and sort control wrap awkwardly on some screen sizes — fixed (2026-07-21): MOOD: label inline with chips, `flex: 0 0 auto` prevents squash, `overflow-x: auto` for scroll on tiny screens, `letter-spacing: 1px`; at 600–1099px TRACK I.D. drops below LISTEN via CSS `flex-basis: 100%` + `order: -1`; nowrap threshold raised to `winW < 1100`

### Data gaps
- [x] ~~Ghetto Symphony Pt. 1 (`mix-046`) and Pt. 2 (`mix-075`) have no tracklist~~ — resolved, both now have full tracklists (10 and 11 entries)
- [x] `soundcloudUrl` filled in for all 5 mixes added 2026-08-20 (`mix-095`–`mix-099`) — all have live SoundCloud posts, added to both `production/public/assets/metadata/mixes.json` and `backend/data/mixes.json`. Note: SoundCloud auto-truncates long track titles into short permalinks (e.g. "If You Aren't Remembered, Then You Never Existed" → `/lo-fi-house-mix-if-you-arent`), so slugs don't always match the site's own `slug` field — verified each via the SoundCloud API (`api-v2.soundcloud.com/users/{id}/tracks`) matching on track duration, not by guessing slugified titles

### Performance
- [x] `js/images.js` (314KB base64 image data in `window.WT_IMG`) is **not loaded** in `index.html` — images are served via direct file paths in JS (`public/assets/images/...`). The file is an orphan artifact and the synchronous-load concern is moot. No action needed.

### Mobile — done
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
- [x] "SELECTED SIGNAL: ..." label above the scene grid — hidden on mobile via `wt-signal-label-row` class + `mobile.css`
- [x] Hero sparse on mobile — reworked to `flex-start` + `padding-top: 100px` on `.wt-hero-text`; dead space now falls below CTAs (breathing room) rather than above the heading
- [x] Landscape orientation — CSS + JS now use same media query; compact layout applied via `@media (orientation: landscape)` in `mobile.css`

---

## Phase 4 — Backend / API

- Response Model exercise (2026-08-20): done for both routers. `mixes.py` — `TrackEntry`/`Mix` Pydantic models added, `response_model=list[Mix]` wired on both `/mixes` and `/mixes/latest`, validated against real data (caught and fixed 206 tracklist entries missing `artist`, and a `views: null` case handled via `int | None`). `scenes.py` — `Scene` model (with `mood: Mood` reusing the existing enum) nested inside a `ScenePage` wrapper model (`total`/`page`/`limit`/`results`), `response_model=ScenePage` wired on `/scenes`; verified live via `TestClient` (bad mood value → 422, page/limit guards still fire, valid requests return the correct shape).
- Path Operation Configuration + Path & Query Validation exercise (2026-08-25): done for both routers. `mixes.py` and `scenes.py` routes now carry `summary`, `status_code=status.HTTP_200_OK`, `response_description`, and `tags=["Mixes"]`/`tags=["Scenes"]`; docstrings added. Manual `if n < 1` / `if page < 1` / `if limit < 1` `HTTPException` blocks replaced with `Query(..., ge=1)` constraints on `limit`/`page` in both files (`mixes.py`'s `n` param also renamed to `limit`, confirmed unused by the frontend so non-breaking — frontend still fetches `mixes.json`/`scenes.json` directly, not the API). `scenes.py` keeps its unused `HTTPException` import intentionally.
- The original `/api/mixes/latest` bug (referenced an undefined `sorted_mixes` name) is fixed — the route now correctly builds and uses `sorted_mixes`.
- Mood enum extracted from `routers/scenes.py` into `backend/models/enums.py` so both routers can share it without `mixes.py` depending on `scenes.py` (2026-08-28).
- `Mix` and `Scene` converted from plain Pydantic models to SQLModel `table=True` classes with auto-incrementing int primary keys, as tutorial practice ahead of the real Phase 5 schema work (2026-08-28). Routers still read from JSON; DB wiring and the `tracklist`→`Track` relationship aren't done yet.
- `id` field removed from `backend/data/mixes.json` and `backend/data/scenes.json` (2026-08-28) — never referenced anywhere in backend code, and incompatible with the new int-based primary key. `production/public/assets/metadata/*.json` keeps `id`, since the live frontend reads it directly (`TX-` display code, session restore, track/scene navigation).
- **Frontend wired to the API (2026-08-29)** — `production/js/app.js` no longer fetches `mixes.json`/`scenes.json`; it fetches `http://localhost:8000/api/mixes` and `/api/scenes?limit=50` instead. Two mapper functions (`wtMapMix`, `wtMapScene`) sit between the fetch and `window.__WT_MIXES`/`__WT_SCENES`, translating the API's snake_case fields back into the camelCase shape every downstream component already expects — chosen over renaming fields across `sections1.js`/`sections2.js`/`app.js`, which would have been a much wider diff for no behavioural gain. The mappers also convert the database's integer primary keys back into the `mix-001`/`scene-001` string IDs the UI renders (`TX-` codes) and persists (session restore); this is safe because `seed.py` inserts in JSON-file order, so PK 1 is always `mix-001`.
  - Three backend changes were needed to make the swap work: (1) `GET /api/mixes` returned `MixPublic` (no tracklist) — the frontend needs a tracklist on *every* mix for the TRACK I.D. panel and the current-track line, so it now returns `MixWithTracks` with `selectinload(Mix.tracks)` to avoid an N+1 query; (2) the same route had no `ORDER BY`, and Postgres returned rows in an arbitrary order that broke the archive's chronological listing and prev/next-mix navigation — added `order_by(Mix.id)`; (3) the `Mix.tracks` relationship had no ordering either, so tracklist entries came back arbitrarily ordered while the frontend's "which track is playing now" lookup scans the list in reverse assuming `timeSecs` order — added `order_by="Track.time_secs"`.
  - Verified in Chrome against local Postgres: both API calls return 200, no console errors, archive renders all 99 mixes with tracklists and correct newest-first sort, scenes render all 44 with episode filter chips, and clicking a scene loads the right `.mp4` with the correct episode label.
  - `WT_API_BASE` is a hardcoded localhost URL — it must become the deployed backend URL in Phase 6, and the site now hard-depends on the API being up (there is no JSON fallback; a backend outage shows the existing BOOT FAILURE screen).
