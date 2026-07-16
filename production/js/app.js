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
function BroadcastBar({ playing, activeTitle, currentTrack, elapsed, progress, railW, tickerItems, onPlayToggle, hasPlayed, isMobile }) {
  var tickerRef = React.useRef(null);
  var posRef = React.useRef(0);
  var rafRef = React.useRef(null);
  var lastTRef = React.useRef(null);
  var SPEED = 60; // px/sec

  React.useEffect(function() {
    var lastOneW = 0;
    var REPEAT = 10;
    function tick(t) {
      var el = tickerRef.current;
      if (el) {
        if (lastTRef.current !== null) {
          var dt = Math.min((t - lastTRef.current) / 1000, 0.1);
          posRef.current -= SPEED * dt;
          var oneW = el.scrollWidth / REPEAT;
          if (lastOneW > 0 && Math.abs(oneW - lastOneW) > 1) {
            posRef.current = (posRef.current / lastOneW) * oneW;
          }
          lastOneW = oneW;
          if (oneW > 0 && posRef.current < -oneW) {
            posRef.current = -((-posRef.current) % oneW);
          }
        }
        lastTRef.current = t;
        el.style.transform = 'translateX(' + posRef.current + 'px)';
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return function() { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  function fmtT(s) {
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return [h, m, sec].map(function(n) { return String(n).padStart(2, '0'); }).join(':');
  }

  var trackLabel = playing && currentTrack
    ? (currentTrack.artist ? currentTrack.artist + ' — ' + currentTrack.title : currentTrack.title)
    : null;
  var playingItems = playing
    ? (activeTitle ? [activeTitle] : []).concat(trackLabel ? [trackLabel] : [])
    : [];
  var allItems = playingItems.concat(tickerItems);
  var REPEAT = 10;
  var loopedItems = [];
  for (var _r = 0; _r < REPEAT; _r++) {
    for (var _j = 0; _j < allItems.length; _j++) { loopedItems.push(allItems[_j]); }
  }

  return /*#__PURE__*/React.createElement("div", {
    className: 'wt-broadcast-bar',
    style: {
      position: 'fixed', bottom: 0, left: railW, right: 0, zIndex: 150,
      background: WT2.sink,
      borderTop: '1px solid ' + WT2.line,
      transition: 'left 0.2s ease',
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: { display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', height: 34 }
  }, playing && /*#__PURE__*/React.createElement(React.Fragment, null,
    /*#__PURE__*/React.createElement("div", {
      style: { display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }
    }, /*#__PURE__*/React.createElement("span", {
      className: 'wt-pulse',
      style: { width: 5, height: 5, borderRadius: 3, background: 'var(--wt-accent)', boxShadow: '0 0 6px var(--wt-accent)', display: 'inline-block', flexShrink: 0 }
    }), /*#__PURE__*/React.createElement("span", {
      style: { fontFamily: WT2.mono, fontSize: 8.5, letterSpacing: 2, color: 'var(--wt-accent)', textShadow: '0 0 6px var(--wt-accent)', whiteSpace: 'nowrap', textTransform: 'uppercase' }
    }, 'ON AIR')),
    /*#__PURE__*/React.createElement("span", { style: { width: 1, height: 14, background: WT2.line2, flexShrink: 0 } })
  ), /*#__PURE__*/React.createElement("div", {
    style: { flex: 1, overflow: 'hidden', minWidth: 0 }
  }, /*#__PURE__*/React.createElement("span", {
    ref: tickerRef,
    style: {
      display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap',
      fontFamily: WT2.mono, letterSpacing: 2,
      textTransform: 'uppercase',
      color: playing ? WT2.body : WT2.dim,
      willChange: 'transform'
    }
  }, loopedItems.map(function(item, i) {
    return /*#__PURE__*/React.createElement(React.Fragment, { key: i },
      /*#__PURE__*/React.createElement("span", { style: { fontSize: 10.5 } }, item),
      /*#__PURE__*/React.createElement("span", { "aria-hidden": true, style: { fontSize: 19, padding: '0 18px', opacity: 0.6 } }, '\xB7')
    );
  }))), playing && !isMobile && /*#__PURE__*/React.createElement(React.Fragment, null,
    /*#__PURE__*/React.createElement("span", { style: { width: 1, height: 14, background: WT2.line2, flexShrink: 0 } }),
    /*#__PURE__*/React.createElement("span", {
      style: { fontFamily: WT2.mono, fontSize: 10, color: WT2.dim, flexShrink: 0, letterSpacing: 0.5, whiteSpace: 'nowrap' }
    }, fmtT(elapsed))
  ), /*#__PURE__*/React.createElement(React.Fragment, null,
    /*#__PURE__*/React.createElement("span", { style: { width: 1, height: 14, background: WT2.line2, flexShrink: 0 } }),
    /*#__PURE__*/React.createElement("button", {
      className: 'wt-broadcast-play-btn',
      onClick: onPlayToggle,
      'aria-label': playing ? 'Pause' : 'Play',
      style: {
        background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px',
        fontFamily: WT2.mono, color: 'var(--wt-accent)',
        textShadow: playing ? '0 0 8px var(--wt-accent)' : 'none',
        flexShrink: 0, lineHeight: 1, display: 'flex', alignItems: 'center',
        justifyContent: 'center', width: isMobile ? 22 : 28
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: { fontSize: playing ? (isMobile ? 8 : 11) : (isMobile ? 13 : 17), display: 'block' }
    }, playing ? '▐▐' : '▶'))
  )), playing && /*#__PURE__*/React.createElement("div", {
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

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return /*#__PURE__*/React.createElement("div", {
        style: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: "'IBM Plex Mono',monospace", color: '#ff8a80', background: '#0a0b0e', padding: 32, textAlign: 'center', flexDirection: 'column', gap: 12 }
      },
        /*#__PURE__*/React.createElement("div", { style: { fontSize: 13, letterSpacing: 2, color: '#c08a82' } }, '[ WEEBTRAX ] RENDER ERROR'),
        /*#__PURE__*/React.createElement("div", { style: { fontSize: 12, color: 'rgba(230,225,212,0.5)', maxWidth: 480 } }, this.state.error.message || String(this.state.error)),
        /*#__PURE__*/React.createElement("div", { style: { fontSize: 11, color: 'rgba(230,225,212,0.3)' } }, 'Check browser console (F12) for full details')
      );
    }
    return this.props.children;
  }
}

function App() {
  const TX = getMixes();
  const _session = loadSession();
  const _restoredId = _session.mixId && TX.find(t => t.id === _session.mixId) ? _session.mixId : null;
  const [t, setTweak] = useTweaks(WT_DEFAULTS);
  const ping = usePing(18000);
  const winW = useWinW();
  const isMobile = useIsMobile();
  const railW = winW < 900 ? RAIL_W_NARROW : RAIL_W;
  const audioRef = React.useRef(null);
  const audioCtxRef = React.useRef(null);
  const analyserRef = React.useRef(null);
  const gainNodeRef = React.useRef(null);
  const pendingRestoreRef = React.useRef(_session.currentTime || 0);
  const activeTxIdRef = React.useRef(_restoredId || TX[0].id);
  const loadTrackRef = React.useRef(null);
  const togglePlayRef = React.useRef(null);
  const fadeOutTimerRef = React.useRef(null);
  const fadeOutAbortRef = React.useRef(null); // cancels pending async doSchedule in fadeOut
  const lastSaveRef = React.useRef(0);
  const [playing, setPlaying] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(Math.floor(_session.currentTime || 0));
  const [hasPlayed, setHasPlayed] = React.useState(Boolean(_restoredId));
  const [activeTxId, setActiveTxId] = React.useState(_restoredId || TX[0].id);
  const [audioProgress, setAudioProgress] = React.useState(0);
  const [audioDurSecs, setAudioDurSecs] = React.useState(null);
  const [seeking, setSeeking] = React.useState(false);
  const [volume, setVolume] = React.useState(1);

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

  // Handle phone lock/unlock (visibilitychange).
  // On hide: explicitly pause the audio element (stops timeupdate → timer freezes)
  // and suspend the AudioContext. onPause fires naturally → setPlaying(false).
  // On show: re-sync elapsed position, resume ctx if iOS suspended it.
  React.useEffect(() => {
    function onVisibilityChange() {
      const ctx = audioCtxRef.current;
      const audio = audioRef.current;
      if (document.visibilityState === 'hidden') {
        // Cancel any pending fade-out (timer + async doSchedule) to avoid stale callbacks after unlock
        if (fadeOutAbortRef.current) { fadeOutAbortRef.current(); fadeOutAbortRef.current = null; }
        if (fadeOutTimerRef.current) { clearTimeout(fadeOutTimerRef.current); fadeOutTimerRef.current = null; }
        if (audio && !audio.paused) audio.pause(); // fires onPause → setPlaying(false), freezes timeupdate
        if (ctx && ctx.state === 'running') ctx.suspend();
      } else {
        // Sync elapsed from actual audio position in case it drifted while page was hidden
        if (audio) {
          setElapsed(Math.floor(audio.currentTime));
          if (audio.duration && isFinite(audio.duration))
            setAudioProgress(Math.min(audio.currentTime / audio.duration, 1));
          setPlaying(!audio.paused);
        }
        if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  // Media Session API — wires lock-screen controls to our audio + AudioContext.
  // The 'play' action handler is a user-gesture context on iOS 15+, which means
  // ctx.resume() is allowed to succeed even while the page is hidden.
  React.useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    const msPlay = () => {
      const audio = audioRef.current;
      const ctx = audioCtxRef.current;
      const doPlay = () => { if (audio && audio.paused) audio.play().catch(() => {}); };
      if (ctx && ctx.state === 'suspended') ctx.resume().then(doPlay).catch(doPlay);
      else doPlay();
    };
    const msPause = () => {
      if (fadeOutAbortRef.current) { fadeOutAbortRef.current(); fadeOutAbortRef.current = null; }
      if (fadeOutTimerRef.current) { clearTimeout(fadeOutTimerRef.current); fadeOutTimerRef.current = null; }
      const audio = audioRef.current;
      if (audio && !audio.paused) audio.pause();
    };
    const msSeekTo = d => {
      const audio = audioRef.current;
      if (audio && isFinite(audio.duration) && d.seekTime != null)
        audio.currentTime = Math.max(0, Math.min(d.seekTime, audio.duration));
    };
    const msSeekFwd = d => { const audio = audioRef.current; if (audio) audio.currentTime = Math.min(audio.currentTime + ((d && d.seekOffset) || 10), audio.duration || 0); };
    const msSeekBwd = d => { const audio = audioRef.current; if (audio) audio.currentTime = Math.max(audio.currentTime - ((d && d.seekOffset) || 10), 0); };
    navigator.mediaSession.setActionHandler('play', msPlay);
    navigator.mediaSession.setActionHandler('pause', msPause);
    try { navigator.mediaSession.setActionHandler('seekto', msSeekTo); } catch {}
    navigator.mediaSession.setActionHandler('seekforward', msSeekFwd);
    navigator.mediaSession.setActionHandler('seekbackward', msSeekBwd);
    return () => ['play', 'pause', 'seekforward', 'seekbackward'].forEach(a => {
      try { navigator.mediaSession.setActionHandler(a, null); } catch {}
    });
  }, []);

  // Update Media Session metadata when the active track changes
  React.useEffect(() => {
    if (!('mediaSession' in navigator) || !window.MediaMetadata) return;
    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: activeTx.title || 'WeebTrax',
      artist: 'WeebTrax',
      album: 'ARCHIVE.SYS'
    });
  }, [activeTxId]);

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
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
    }
    function onPause() {
      setPlaying(false);
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
    }
    function onEnded() {
      setAudioProgress(1);
      setElapsed(Math.floor(audio.duration));
      const allMixes = getMixes();
      const idx = allMixes.findIndex(function(m) { return m.id === activeTxIdRef.current; });
      const next = allMixes[idx + 1];
      if (next && loadTrackRef.current) {
        loadTrackRef.current(next.id);
      } else {
        setPlaying(false);
      }
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
  // Volume is controlled via GainNode in the Web Audio graph.
  // audio.volume has no effect once createMediaElementSource is called.
  React.useEffect(() => {
    if (gainNodeRef.current) gainNodeRef.current.gain.value = volume;
    else if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // Fallback simulated timer for tracks without a real audioSrc
  const activeTx = TX.find(tx => tx.id === activeTxId) || TX[0];
  const hasRealAudio = activeTx.audioSrc && activeTx.audioSrc !== '#';
  React.useEffect(() => {
    if (!playing || hasRealAudio) return;
    const id = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [playing, hasRealAudio]);

  // Current track within the mix — find last entry whose timeSecs <= elapsed
  const _tracklist = activeTx.tracklist || [];
  const currentTrack = _tracklist.length > 0
    ? (_tracklist.filter(function(t) { return t.timeSecs <= elapsed; }).pop() || _tracklist[0])
    : null;

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
      ensureAnalyser();
      fadeIn();
      audio.play().catch(() => {});
    } else {
      setHasPlayed(true);
      setPlaying(true);
    }
  }
  loadTrackRef.current = loadTrack;
  const FADE_IN_SECS = 0.2;
  const FADE_OUT_SECS = 0.015;
  function fadeIn() {
    const gain = gainNodeRef.current;
    const ctx = audioCtxRef.current;
    if (!gain || !ctx) return;
    // Cancel any pending fade-out, including async doSchedule not yet fired
    if (fadeOutAbortRef.current) { fadeOutAbortRef.current(); fadeOutAbortRef.current = null; }
    if (fadeOutTimerRef.current) { clearTimeout(fadeOutTimerRef.current); fadeOutTimerRef.current = null; }
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + FADE_IN_SECS);
  }
  function fadeOut(onDone) {
    const gain = gainNodeRef.current;
    const ctx = audioCtxRef.current;
    if (!gain || !ctx) { onDone(); return; }
    // Cancel any in-flight fadeout timer or pending async doSchedule
    if (fadeOutAbortRef.current) { fadeOutAbortRef.current(); fadeOutAbortRef.current = null; }
    if (fadeOutTimerRef.current) { clearTimeout(fadeOutTimerRef.current); fadeOutTimerRef.current = null; }
    let aborted = false;
    fadeOutAbortRef.current = () => { aborted = true; };
    const doSchedule = () => {
      if (aborted) return;
      const now = ctx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + FADE_OUT_SECS);
      // +30ms buffer so the ramp always finishes before onDone fires
      fadeOutTimerRef.current = setTimeout(() => {
        fadeOutTimerRef.current = null;
        if (aborted) return;
        fadeOutAbortRef.current = null;
        onDone();
        const t2 = audioCtxRef.current ? audioCtxRef.current.currentTime : 0;
        if (gainNodeRef.current) {
          gainNodeRef.current.gain.cancelScheduledValues(t2);
          gainNodeRef.current.gain.setValueAtTime(volume, t2);
        }
      }, FADE_OUT_SECS * 1000 + 30);
    };
    // If the context is suspended, resume it first so ctx.currentTime is live.
    // The abort flag prevents doSchedule from running if fadeIn() fires before the promise resolves.
    if (ctx.state === 'suspended') { ctx.resume().then(doSchedule).catch(() => { if (!aborted) onDone(); }); }
    else { doSchedule(); }
  }
  function ensureAnalyser() {
    if (analyserRef.current) {
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const src = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.92;
      const gainNode = ctx.createGain();
      gainNode.gain.value = gainNodeRef.current ? gainNodeRef.current.gain.value : 1;
      src.connect(analyser);
      analyser.connect(gainNode);
      gainNode.connect(ctx.destination);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      gainNodeRef.current = gainNode;
      window.__WT_ANALYSER = analyser;
    } catch(e) {}
  }
  // Keyboard shortcuts: Space = play/pause, ← = back 10s, → = forward 10s
  React.useEffect(() => {
    function onKeyDown(e) {
      const tag = (document.activeElement || {}).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const audio = audioRef.current;
      if (!audio) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (!audio.src || audio.src === location.href) {
          const tx = getMixes().find(function(m) { return m.id === activeTxIdRef.current; });
          if (tx && tx.audioSrc && tx.audioSrc !== '#') { audio.src = tx.audioSrc; audio.load(); }
        }
        if (togglePlayRef.current) togglePlayRef.current();
      } else if (e.code === 'ArrowRight' && isFinite(audio.duration)) {
        e.preventDefault();
        audio.currentTime = Math.min(audio.currentTime + 10, audio.duration);
      } else if (e.code === 'ArrowLeft' && isFinite(audio.duration)) {
        e.preventDefault();
        audio.currentTime = Math.max(audio.currentTime - 10, 0);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return function() { window.removeEventListener('keydown', onKeyDown); };
  }, []);
  function togglePlay() {
    const audio = audioRef.current;
    if (audio && hasRealAudio) {
      if (!audio.src || audio.src === location.href) {
        audio.src = activeTx.audioSrc;
        audio.load();
      }
      ensureAnalyser();
      // Use audio.paused (ground truth) not React `playing` state (can be stale after lock/unlock)
      if (!audio.paused) { fadeOut(() => audio.pause()); } else { fadeIn(); audio.play().catch(() => {}); }
    } else {
      if (!playing) setHasPlayed(true);
      setPlaying(p => !p);
    }
  }
  togglePlayRef.current = togglePlay;
  function resetPlay() {
    const audio = audioRef.current;
    if (audio) {
      fadeOut(() => { audio.pause(); audio.currentTime = 0; });
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
  }), /*#__PURE__*/React.createElement(Overlays, null), /*#__PURE__*/React.createElement(Rail, null), /*#__PURE__*/React.createElement(MobileNav, null), /*#__PURE__*/React.createElement(BroadcastBar, {
    playing: playing,
    activeTitle: activeTx.title,
    currentTrack: currentTrack,
    elapsed: elapsed,
    progress: displayProgress,
    railW: isMobile ? 0 : railW,
    tickerItems: isMobile ? ['NEW TRANSMISSION EVERY SATURDAY', 'SUBMISSIONS OPEN'] : ['NEW TRANSMISSION EVERY SATURDAY', 'SUBMISSIONS OPEN', pingLabel(ping)],
    onPlayToggle: togglePlay,
    hasPlayed: hasPlayed,
    isMobile: isMobile
  }), /*#__PURE__*/React.createElement("main", {
    style: {
      marginLeft: isMobile ? 0 : railW,
      paddingBottom: 48,
      transition: 'margin-left 0.2s ease'
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
  ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(ErrorBoundary, null, /*#__PURE__*/React.createElement(App, null)));
}).catch(function(err) {
  console.error('[WeebTrax] Failed to load metadata:', err);
  var root = document.getElementById('root');
  if (root) {
    root.style.cssText = 'display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:monospace;color:#ff8a80;background:#0a0b0e;padding:32px;text-align:center;flex-direction:column;gap:12px';
    root.innerHTML = '<div style="font-size:13px;letter-spacing:2px;color:#c08a82">[ WEEBTRAX ] BOOT FAILURE</div><div style="font-size:12px;color:rgba(230,225,212,0.5);max-width:480px">' + (err && err.message ? err.message : String(err)) + '</div><div style="font-size:11px;color:rgba(230,225,212,0.3)">Check browser console (F12) for full details</div>';
  }
});