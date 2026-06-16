// app.jsx — assembles the WeebTrax ARCHIVE.SYS comp + Tweaks panel.
// TODO: Cross-device / multi-account persistence requires backend + auth (Phase 4/5).
// Currently using localStorage for single-browser session restore only.
const WT_SESSION_KEY = 'wt_session';
function loadSession() {
  try { return JSON.parse(localStorage.getItem(WT_SESSION_KEY)) || {}; } catch { return {}; }
}
function saveSession(mixId, currentTime) {
  try { localStorage.setItem(WT_SESSION_KEY, JSON.stringify({ mixId, currentTime })); } catch {}
}

const WT_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#8fbf9f",
  "headfont": "'Special Elite'",
  "scan": true,
  "grain": true,
  "motion": true
} /*EDITMODE-END*/;
const ACCENTS = ['#8fbf9f', '#a895bd', '#8a9cc0', '#c9b48a', '#c08a82', '#e6e1d4'];
// fallback heading face — used until TrixieCyrG Plain / Loveletter TW files are dropped in comp/fonts/
const HEADFONTS = [{
  label: 'Typewriter',
  value: "'Special Elite'"
}, {
  label: 'Terminal',
  value: "'VT323'"
}, {
  label: 'Mincho',
  value: "'Zen Old Mincho'"
}];
function _fmtTime(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor(secs % 3600 / 60);
  const s = secs % 60;
  return [h, m, s].map(n => String(n).padStart(2, '0')).join(':');
}
function _parseRunSecs(run) {
  const parts = (run || '00:00:00').split(':').map(Number);
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
}
function usePing(intervalMs = 18000) {
  const [ping, setPing] = React.useState(null);
  React.useEffect(() => {
    let cancelled = false;
    async function measure() {
      try {
        const url = location.href.split('?')[0] + '?_p=' + Date.now();
        const t0 = performance.now();
        await fetch(url, {
          method: 'HEAD',
          cache: 'no-store'
        });
        if (!cancelled) setPing(Math.round(performance.now() - t0));
      } catch {
        if (!cancelled) setPing(-1);
      }
    }
    measure();
    const id = setInterval(measure, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);
  return ping;
}
function pingLabel(ms) {
  if (ms === null) return 'WIRED ACTIVITY · MEASURING…';
  if (ms < 0) return 'WIRED ACTIVITY — NO SIGNAL ▒▒▒▒▒';
  const bars = ms < 30 ? '▌▌▌▌▌' : ms < 80 ? '▌▌▌▌░' : ms < 150 ? '▌▌▌░░' : ms < 300 ? '▌▌░░░' : '▌░░░░';
  return 'WIRED ACTIVITY · ' + ms + 'ms ' + bars;
}
function NowPlaying({ playing, title, elapsed, progress, railW }) {
  // Inject marquee keyframes once
  React.useEffect(function() {
    if (document.getElementById('wt-np-kf')) return;
    var s = document.createElement('style');
    s.id = 'wt-np-kf';
    // Seamless loop: text is doubled, scroll 50% = one full copy
    s.textContent = '@keyframes wt-np-scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}';
    document.head.appendChild(s);
  }, []);

  function fmtT(s) {
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return [h, m, sec].map(function(n) { return String(n).padStart(2, '0'); }).join(':');
  }

  // Double title for seamless scroll loop
  var loop = title + '   ·   ' + title + '   ·   ';

  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed', bottom: 0, left: railW, right: 0, zIndex: 150,
      opacity: playing ? 1 : 0,
      transform: playing ? 'translateY(0)' : 'translateY(100%)',
      transition: 'opacity .5s ease, transform .5s ease',
      pointerEvents: playing ? 'auto' : 'none',
      background: 'rgba(7,8,9,0.95)',
      borderTop: '1px solid rgba(143,191,159,0.18)',
      backdropFilter: 'blur(10px)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: { display: 'flex', alignItems: 'center', gap: 14, padding: '0 20px', height: 40 }
  }, /*#__PURE__*/React.createElement("div", {
    style: { display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }
  }, /*#__PURE__*/React.createElement("span", {
    className: 'wt-pulse',
    style: { width: 6, height: 6, borderRadius: 3, background: 'var(--wt-accent)', boxShadow: '0 0 8px var(--wt-accent)', display: 'inline-block', flexShrink: 0 }
  }), /*#__PURE__*/React.createElement("span", {
    style: { fontFamily: WT2.mono, fontSize: 9, letterSpacing: 2, color: 'var(--wt-accent)', textShadow: '0 0 6px var(--wt-accent)', whiteSpace: 'nowrap' }
  }, 'ON AIR')), /*#__PURE__*/React.createElement("span", {
    style: { width: 1, height: 16, background: 'rgba(214,209,198,0.14)', flexShrink: 0 }
  }), /*#__PURE__*/React.createElement("div", {
    style: { flex: 1, overflow: 'hidden', minWidth: 0 }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-block', whiteSpace: 'nowrap',
      fontFamily: WT2.display, fontSize: 13, color: WT2.ink,
      animation: 'wt-np-scroll 22s linear infinite'
    }
  }, loop)), /*#__PURE__*/React.createElement("span", {
    style: { width: 1, height: 16, background: 'rgba(214,209,198,0.14)', flexShrink: 0 }
  }), /*#__PURE__*/React.createElement("span", {
    style: { fontFamily: WT2.mono, fontSize: 10.5, color: WT2.dim, flexShrink: 0, letterSpacing: 0.5, whiteSpace: 'nowrap' }
  }, fmtT(elapsed))), /*#__PURE__*/React.createElement("div", {
    style: { position: 'relative', height: 2, background: 'rgba(214,209,198,0.06)' }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute', left: 0, top: 0, bottom: 0,
      width: (progress * 100) + '%',
      background: 'var(--wt-accent)',
      boxShadow: '0 0 8px var(--wt-accent)',
      transition: 'width 0.1s linear'
    }
  })));
}
function App() {
  const TX = getMixes();
  const _session = loadSession();
  const _restoredId = _session.mixId && TX.find(t => t.id === _session.mixId) ? _session.mixId : null;
  const [t, setTweak] = useTweaks(WT_DEFAULTS);
  const ping = usePing(18000);
  const winW = useWinW();
  const railW = winW < 560 ? RAIL_W_NARROW : RAIL_W;
  const audioRef = React.useRef(null);
  const pendingRestoreRef = React.useRef(_session.currentTime || 0);
  const activeTxIdRef = React.useRef(_restoredId || TX[0].id);
  const lastSaveRef = React.useRef(0);
  const [playing, setPlaying] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(Math.floor(_session.currentTime || 0));
  const [hasPlayed, setHasPlayed] = React.useState(Boolean(_restoredId));
  const [activeTxId, setActiveTxId] = React.useState(_restoredId || TX[0].id);
  const [audioProgress, setAudioProgress] = React.useState(0);
  const [audioDurSecs, setAudioDurSecs] = React.useState(null);
  const [seeking, setSeeking] = React.useState(false);
  const [volume, setVolume] = React.useState(0.8);

  // Keep activeTxIdRef in sync for use inside event listeners
  React.useEffect(() => { activeTxIdRef.current = activeTxId; }, [activeTxId]);

  // On mount: if restoring a session, pre-load the track (no autoplay)
  React.useEffect(() => {
    if (pendingRestoreRef.current > 0) {
      const tx = TX.find(t => t.id === activeTxIdRef.current);
      const audio = audioRef.current;
      if (audio && tx && tx.audioSrc && tx.audioSrc !== '#') {
        audio.src = tx.audioSrc;
        audio.load();
        // seek happens in onLoadedMetadata below
      }
    }
  }, []);

  // Save session on page unload / hide
  React.useEffect(() => {
    function onUnload() {
      const audio = audioRef.current;
      saveSession(activeTxIdRef.current, audio ? Math.floor(audio.currentTime) : 0);
    }
    window.addEventListener('beforeunload', onUnload);
    window.addEventListener('pagehide', onUnload);
    return () => {
      window.removeEventListener('beforeunload', onUnload);
      window.removeEventListener('pagehide', onUnload);
    };
  }, []);

  // Wire real HTML audio events
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    function onTimeUpdate() {
      if (audio.duration && isFinite(audio.duration)) {
        setElapsed(Math.min(Math.floor(audio.currentTime), Math.floor(audio.duration)));
        setAudioProgress(Math.min(audio.currentTime / audio.duration, 1));
        // Save session every 5 s to capture timestamp without excessive writes
        const now = Date.now();
        if (now - lastSaveRef.current > 5000) {
          lastSaveRef.current = now;
          saveSession(activeTxIdRef.current, Math.floor(audio.currentTime));
        }
      }
    }
    function onLoadedMetadata() {
      if (isFinite(audio.duration)) setAudioDurSecs(Math.floor(audio.duration));
      // Restore saved timestamp on session reload (keep paused)
      if (pendingRestoreRef.current > 0 && audio.duration > 0) {
        audio.currentTime = Math.min(pendingRestoreRef.current, audio.duration - 1);
        setElapsed(Math.floor(audio.currentTime));
        setAudioProgress(Math.min(audio.currentTime / audio.duration, 1));
        pendingRestoreRef.current = 0;
      }
    }
    function onPlay() {
      setPlaying(true);
      setHasPlayed(true);
    }
    function onPause() {
      setPlaying(false);
    }
    function onEnded() {
      setPlaying(false);
      setAudioProgress(1);
      setElapsed(Math.floor(audio.duration));
    }
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);
  // Controls <audio> element volume (0–1). Browser JS cannot access system/OS volume
  // for security reasons — there is no cross-browser API to read or set it.
  React.useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume;
  }, [volume]);

  // Fallback simulated timer for tracks without a real audioSrc
  const activeTx = TX.find(tx => tx.id === activeTxId) || TX[0];
  const hasRealAudio = activeTx.audioSrc && activeTx.audioSrc !== '#';
  React.useEffect(() => {
    if (!playing || hasRealAudio) return;
    const id = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [playing, hasRealAudio]);

  // Derived display values
  const runSecs = _parseRunSecs(activeTx.run);
  const displayProgress = hasRealAudio ? audioProgress : runSecs > 0 ? Math.min(elapsed / runSecs, 1) : 0;
  const displayDuration = audioDurSecs ? _fmtTime(audioDurSecs) : activeTx.run;
  function loadTrack(id) {
    const tx = TX.find(tx => tx.id === id);
    if (!tx) return;
    setActiveTxId(id);
    activeTxIdRef.current = id;
    saveSession(id, 0);
    setElapsed(0);
    setAudioProgress(0);
    setAudioDurSecs(null);
    const audio = audioRef.current;
    if (audio && tx.audioSrc && tx.audioSrc !== '#') {
      audio.src = tx.audioSrc;
      audio.load();
      audio.play().catch(() => {});
    } else {
      setHasPlayed(true);
      setPlaying(true);
    }
  }
  function togglePlay() {
    const audio = audioRef.current;
    if (audio && hasRealAudio) {
      if (playing) audio.pause();else audio.play().catch(() => {});
    } else {
      if (!playing) setHasPlayed(true);
      setPlaying(p => !p);
    }
  }
  function resetPlay() {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setPlaying(false);
    setElapsed(0);
    setAudioProgress(0);
  }
  function seekTo(fraction) {
    const audio = audioRef.current;
    if (hasRealAudio && audio && isFinite(audio.duration)) {
      audio.currentTime = fraction * audio.duration;
    } else {
      // simulated timer: map fraction to elapsed seconds
      setElapsed(Math.round(Math.max(0, Math.min(1, fraction)) * runSecs));
    }
  }
  React.useEffect(() => {
    const r = document.documentElement;
    r.style.setProperty('--wt-accent', t.accent);
    r.style.setProperty('--wt-headfont', t.headfont);
  }, [t.accent, t.headfont]);
  React.useEffect(() => {
    document.body.classList.toggle('no-scan', !t.scan);
    document.body.classList.toggle('no-grain', !t.grain);
    document.body.classList.toggle('no-motion', !t.motion);
  }, [t.scan, t.grain, t.motion]);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("audio", {
    ref: audioRef,
    style: {
      display: 'none'
    }
  }), /*#__PURE__*/React.createElement(Overlays, null), /*#__PURE__*/React.createElement(Rail, null), /*#__PURE__*/React.createElement(NowPlaying, {
    playing: playing,
    title: activeTx.title,
    elapsed: elapsed,
    progress: displayProgress,
    railW: railW
  }), /*#__PURE__*/React.createElement("main", {
    style: {
      marginLeft: railW,
      paddingBottom: 48
    }
  }, /*#__PURE__*/React.createElement(Hero, {
    playing: playing,
    elapsed: elapsed,
    duration: displayDuration,
    hasPlayed: hasPlayed,
    progress: displayProgress,
    activeTitle: activeTx.title,
    activeTxCode: 'TX-' + activeTx.id,
    onSeek: seekTo,
    seeking: seeking,
    onSeekStateChange: setSeeking
  }), /*#__PURE__*/React.createElement(Ticker, {
    items: ['NEW TRANSMISSION EVERY SATURDAY', (TX[TX.length - 1] ? TX[TX.length - 1].title + ' — now decoding' : 'latest mix — now decoding'), 'SUBMISSIONS OPEN', pingLabel(ping), 'PRESENT DAY · PRESENT TIME']
  }), /*#__PURE__*/React.createElement(Transmissions, {
    playing: playing,
    onPlayToggle: togglePlay,
    elapsed: elapsed,
    onReset: resetPlay,
    activeTxId: activeTxId,
    onLoadTrack: loadTrack,
    progress: displayProgress,
    onSeek: seekTo,
    seeking: seeking,
    onSeekStateChange: setSeeking,
    vol: volume,
    onVolChange: setVolume
  }), /*#__PURE__*/React.createElement(Features, null), /*#__PURE__*/React.createElement(Submissions, null), /*#__PURE__*/React.createElement(Cta, null), /*#__PURE__*/React.createElement(Footer, null)), /*#__PURE__*/React.createElement(TweaksPanel, null, /*#__PURE__*/React.createElement(TweakSection, {
    label: "Signal"
  }), /*#__PURE__*/React.createElement(TweakColor, {
    label: "Accent",
    value: t.accent,
    options: ACCENTS,
    onChange: v => setTweak('accent', v)
  }), /*#__PURE__*/React.createElement(TweakRadio, {
    label: "Heading font",
    value: t.headfont,
    options: HEADFONTS,
    onChange: v => setTweak('headfont', v)
  }), /*#__PURE__*/React.createElement(TweakSection, {
    label: "Texture"
  }), /*#__PURE__*/React.createElement(TweakToggle, {
    label: "CRT scanlines",
    value: t.scan,
    onChange: v => setTweak('scan', v)
  }), /*#__PURE__*/React.createElement(TweakToggle, {
    label: "Film grain",
    value: t.grain,
    onChange: v => setTweak('grain', v)
  }), /*#__PURE__*/React.createElement(TweakToggle, {
    label: "Motion / glitch",
    value: t.motion,
    onChange: v => setTweak('motion', v)
  })));
}
Promise.all([
  fetch('/public/assets/metadata/mixes.json').then(function(r) { return r.json(); }),
  fetch('/public/assets/metadata/scenes.json').then(function(r) { return r.json(); })
]).then(function(results) {
  window.__WT_MIXES = results[0];
  window.__WT_SCENES = results[1];
  ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
}).catch(function(err) {
  console.error('[WeebTrax] Failed to load metadata:', err);
});