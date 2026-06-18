// sections1.jsx — Rail, Hero, Features. Exports to window.

function useWinW() {
  const [w, setW] = React.useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  React.useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return w;
}
function fmtTime(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor(secs % 3600 / 60);
  const s = secs % 60;
  return [h, m, s].map(n => String(n).padStart(2, '0')).join(':');
}
const RAIL_W = 112;
const RAIL_W_NARROW = 48;
const RAIL_SECTIONS = ['wt-index', 'wt-archive', 'wt-signal', 'wt-uplink', 'wt-wired'];
function Rail() {
  const nav = ['HOME', 'ARCHIVE', 'SCENES', 'SUBMIT', 'ABOUT'];
  const [active, setActive] = React.useState(0);
  const [hovNav, setHovNav] = React.useState(-1);
  const winW = useWinW();
  const compact = winW < 560;
  const rW = compact ? RAIL_W_NARROW : RAIL_W;
  React.useEffect(() => {
    function onScroll() {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        setActive(RAIL_SECTIONS.length - 1);
        return;
      }
      const vpCenter = window.scrollY + window.innerHeight / 2;
      let best = 0;
      let bestDist = Infinity;
      RAIL_SECTIONS.forEach((id, i) => {
        const el = document.getElementById(id);
        if (!el) return;
        const elCenter = el.offsetTop + el.offsetHeight / 2;
        const dist = Math.abs(elCenter - vpCenter);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      setActive(best);
    }
    window.addEventListener('scroll', onScroll, {
      passive: true
    });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  function scrollTo(i) {
    setActive(i);
    const el = document.getElementById(RAIL_SECTIONS[i]);
    if (el) el.scrollIntoView({
      behavior: 'smooth'
    });
  }
  return /*#__PURE__*/React.createElement("aside", {
    style: {
      position: 'fixed',
      left: 0,
      top: 0,
      bottom: 0,
      width: rW,
      zIndex: 200,
      borderRight: `1px solid ${WT2.line}`,
      background: 'rgba(7,8,9,0.92)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: compact ? '14px 0' : '20px 0',
      transition: 'width 0.2s'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: compact ? 28 : 42,
      height: compact ? 28 : 42,
      border: `1px solid ${WT2.line2}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      background: 'rgba(143,191,159,0.03)',
      flexShrink: 0
    }
  }, !compact && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 3,
      left: 3,
      width: 6,
      height: 6,
      borderTop: `1px solid ${WT2.green}`,
      borderLeft: `1px solid ${WT2.green}`
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 3,
      right: 3,
      width: 6,
      height: 6,
      borderBottom: `1px solid ${WT2.green}`,
      borderRight: `1px solid ${WT2.green}`
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: WT2.mono,
      fontWeight: 700,
      fontSize: compact ? 9 : 12,
      letterSpacing: 1,
      color: WT2.green,
      textShadow: `0 0 10px ${WT2.green}`
    }
  }, "WT")), /*#__PURE__*/React.createElement("nav", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: compact ? 18 : 22
    }
  }, nav.map((t, i) => /*#__PURE__*/React.createElement("button", {
    key: t,
    onClick: () => scrollTo(i),
    onMouseEnter: () => setHovNav(i),
    onMouseLeave: () => setHovNav(-1),
    title: compact ? t : undefined,
    style: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: compact ? '6px' : '4px 0'
    }
  }, compact ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      width: 7,
      height: 7,
      borderRadius: 4,
      background: i === active ? 'var(--wt-accent)' : hovNav === i ? WT2.dim : WT2.faint,
      boxShadow: i === active ? '0 0 8px var(--wt-accent)' : hovNav === i ? '0 0 4px rgba(230,225,212,0.3)' : 'none',
      transition: 'background .15s, box-shadow .15s'
    }
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: WT2.mono,
      fontSize: 12,
      letterSpacing: 2.5,
      writingMode: 'vertical-rl',
      transform: 'rotate(180deg)',
      color: i === active ? 'var(--wt-accent)' : hovNav === i ? WT2.body : WT2.faint,
      transition: 'color .15s, text-shadow .15s',
      textShadow: i === active ? '0 0 10px var(--wt-accent)' : hovNav === i ? '0 0 6px rgba(230,225,212,0.25)' : 'none'
    }
  }, t)))), compact ? /*#__PURE__*/React.createElement("span", {
    className: "wt-pulse",
    style: {
      width: 5,
      height: 5,
      borderRadius: 3,
      background: 'var(--wt-accent)',
      boxShadow: '0 0 6px var(--wt-accent)'
    }
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 9
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "wt-pulse",
    style: {
      width: 7,
      height: 7,
      borderRadius: 5,
      background: 'var(--wt-accent)',
      boxShadow: '0 0 8px var(--wt-accent)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: WT2.mono,
      fontSize: 8.5,
      letterSpacing: 1,
      color: WT2.faint,
      writingMode: 'vertical-rl',
      transform: 'rotate(180deg)'
    }
  }, "NODE.227")));
}
function SeekBar({
  progress,
  onSeek,
  height = 6,
  mt = 9,
  onSeekStateChange
}) {
  const trackRef = React.useRef(null);
  const draggingRef = React.useRef(false);
  const [seeking, setSeeking] = React.useState(false);
  function getFraction(e) {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  }
  function onPointerDown(e) {
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingRef.current = true;
    setSeeking(true);
    if (onSeekStateChange) onSeekStateChange(true);
    if (onSeek) onSeek(getFraction(e));
  }
  function onPointerMove(e) {
    if (!draggingRef.current) return;
    if (onSeek) onSeek(getFraction(e));
  }
  function onPointerUp() {
    draggingRef.current = false;
    setSeeking(false);
    if (onSeekStateChange) onSeekStateChange(false);
  }
  function onKeyDown(e) {
    if (!onSeek) return;
    const step = 0.02;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      onSeek(Math.min(1, (progress || 0) + step));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      onSeek(Math.max(0, (progress || 0) - step));
    } else if (e.key === 'Home') {
      e.preventDefault();
      onSeek(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      onSeek(1);
    }
  }
  const pct = (progress || 0) * 100;
  return /*#__PURE__*/ /* Outer div: large hit area (paddingTop/Bottom expand clickable zone) */React.createElement("div", {
    role: "slider",
    "aria-label": "Mix timeline",
    "aria-valuenow": Math.round(pct),
    "aria-valuemin": 0,
    "aria-valuemax": 100,
    tabIndex: 0,
    onPointerDown: onPointerDown,
    onPointerMove: onPointerMove,
    onPointerUp: onPointerUp,
    onPointerCancel: onPointerUp,
    onKeyDown: onKeyDown,
    style: {
      marginTop: mt,
      paddingTop: 9,
      paddingBottom: 9,
      cursor: onSeek ? 'pointer' : 'default',
      outline: 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    ref: trackRef,
    style: {
      height,
      background: WT2.fill2,
      position: 'relative',
      borderRadius: height / 2
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: `${pct}%`,
      background: 'var(--wt-accent)',
      borderRadius: height / 2,
      transition: seeking ? 'none' : 'width 0.1s linear'
    }
  }), onSeek && /*#__PURE__*/React.createElement("div", {
    className: "wt-pulse",
    style: {
      position: 'absolute',
      top: '50%',
      left: `${pct}%`,
      transform: 'translate(-50%, -50%)',
      width: 14,
      height: 14,
      borderRadius: 7,
      background: 'var(--wt-accent)',
      boxShadow: `0 0 ${seeking ? 8 : 4}px var(--wt-accent)`,
      transition: 'box-shadow 0.2s',
      pointerEvents: 'none'
    }
  })));
}

// Phase-lag ghost layers shown while the window is being resized.
// Mimics the stepped halftone offset effect visible in the hero image itself.
const LAG_GHOSTS = [{
  dx: 22,
  opacity: 0.46,
  hue: -22,
  sat: 2.3
}, {
  dx: 48,
  opacity: 0.28,
  hue: -40,
  sat: 2.0
}, {
  dx: 80,
  opacity: 0.15,
  hue: -58,
  sat: 1.8
}, {
  dx: 120,
  opacity: 0.07,
  hue: -80,
  sat: 1.5
}];
function Hero({
  playing,
  elapsed,
  duration,
  hasPlayed,
  progress,
  activeTitle,
  activeTxCode,
  onSeek,
  seeking,
  onSeekStateChange
}) {
  const [clock, setClock] = React.useState('--:--:--');
  const winW = useWinW();
  const narrow = winW < 1120;
  const glitchingRef = React.useRef(false);
  const glitchTimer = React.useRef(null);
  const glitchT = React.useRef(0);
  const rafRef = React.useRef(null);
  const ghostRefs = [React.useRef(null), React.useRef(null), React.useRef(null), React.useRef(null)];
  React.useEffect(() => {
    const FREQS = [0.9, 1.5, 2.1, 2.8];
    const AMPS = [5, 10, 15, 8];
    const PHASES = [0, Math.PI * 0.65, Math.PI * 1.3, Math.PI * 0.4];
    function tick() {
      if (glitchingRef.current) {
        glitchT.current += 0.032;
        const t = glitchT.current;
        ghostRefs.forEach((ref, i) => {
          if (!ref.current) return;
          const offset = Math.sin(t * FREQS[i] + PHASES[i]) * AMPS[i];
          ref.current.style.transform = `translateX(${(LAG_GHOSTS[i].dx + offset).toFixed(2)}px)`;
          ref.current.style.opacity = String(LAG_GHOSTS[i].opacity);
        });
      } else {
        ghostRefs.forEach(ref => {
          if (ref.current) ref.current.style.opacity = '0';
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    tick();
    function onResize() {
      glitchingRef.current = true;
      clearTimeout(glitchTimer.current);
      glitchTimer.current = setTimeout(() => {
        glitchingRef.current = false;
      }, 1400);
    }
    window.addEventListener('resize', onResize, {
      passive: true
    });
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
      clearTimeout(glitchTimer.current);
    };
  }, []);
  React.useEffect(() => {
    const tick = () => {
      const d = new Date();
      setClock(d.toTimeString().slice(0, 8));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return /*#__PURE__*/React.createElement("section", {
    id: "wt-index",
    style: {
      position: 'relative',
      minHeight: '100vh',
      borderBottom: `1px solid ${WT2.line}`,
      overflow: 'hidden',
      isolation: 'isolate',
      display: narrow ? 'flex' : 'block',
      flexDirection: narrow ? 'column' : undefined,
      justifyContent: narrow ? 'flex-end' : undefined,
      paddingBottom: narrow ? 52 : undefined
    }
  }, winW >= 480 && /*#__PURE__*/React.createElement("div", {
    className: "wt-hero-visual",
    style: winW < 1120 ? {
      opacity: winW < 760 ? 0.35 : 0.55
    } : {}
  }, /*#__PURE__*/React.createElement("img", {
    className: "wt-kenburns",
    src: "public/assets/images/43047_serial_experiments_lain.jpg",
    alt: ""
  }), LAG_GHOSTS.map(({
    dx,
    hue,
    sat
  }, i) => /*#__PURE__*/React.createElement("img", {
    key: i,
    ref: ghostRefs[i],
    "aria-hidden": true,
    src: "public/assets/images/43047_serial_experiments_lain.jpg",
    alt: "",
    style: {
      transform: `translateX(${dx}px)`,
      opacity: 0,
      filter: `hue-rotate(${hue}deg) saturate(${sat}) brightness(1.15)`,
      mixBlendMode: 'screen',
      transition: 'opacity 0.45s ease'
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'radial-gradient(ellipse 60% 75% at 80% 58%, rgba(196,115,135,0.13) 0%, transparent 72%)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(180deg, rgba(10,11,14,0.5) 0%, rgba(10,11,14,0.0) 22%, rgba(10,11,14,0.05) 55%, rgba(10,11,14,0.80) 100%)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(90deg, rgba(10,11,14,0.92) 0%, rgba(10,11,14,0.60) 40%, rgba(10,11,14,0.12) 62%, transparent 80%)'
    }
  }), /*#__PURE__*/React.createElement(FrameTicks, {
    inset: 22,
    len: 26,
    color: WT2.line2
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 24,
      left: 40,
      right: 40,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: WT2.mono,
      fontSize: 11.5,
      color: WT2.body,
      letterSpacing: 0.5
    }
  }, "wired://weebtrax/connect \xA0\u2014\xA0 status: ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--wt-accent)'
    }
  }, "ONLINE"), /*#__PURE__*/React.createElement(Cursor, null)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: WT2.mono,
      fontSize: 11.5,
      color: WT2.dim,
      letterSpacing: 1,
      display: narrow && winW < 600 ? 'none' : 'flex',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("span", null, "\u2301 44.1kHz"), /*#__PURE__*/React.createElement("span", null, clock))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...(narrow ? {
        position: 'relative',
        zIndex: 4,
        padding: winW < 480 ? '0 20px 0' : '0 40px 0'
      } : {
        position: 'absolute',
        left: 40,
        bottom: 52,
        zIndex: 4,
        maxWidth: 720
      })
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: WT2.mono,
      fontSize: 10.5,
      color: 'var(--wt-accent)',
      letterSpacing: 1
    }
  }, "\u258C"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: WT2.mono,
      fontSize: 10.5,
      color: 'var(--wt-accent)',
      letterSpacing: 2.5,
      textTransform: 'uppercase'
    }
  }, "MODULE .00"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: WT2.mono,
      fontSize: 10.5,
      color: WT2.faint,
      letterSpacing: 2.5,
      textTransform: 'uppercase'
    }
  }, "// HOME")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement(Tag, {
    color: "var(--wt-accent)"
  }, "LO-FI HOUSE"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: WT2.mono,
      fontSize: 11,
      color: WT2.dim,
      letterSpacing: 1
    }
  }, "transmitting from the wired")), /*#__PURE__*/React.createElement(Wordmark, {
    size: 'clamp(52px, 11vw, 132px)',
    as: "h1",
    style: {
      margin: 0
    }
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '18px 0 28px',
      fontFamily: WT2.mono,
      fontSize: 15,
      lineHeight: 1.6,
      color: WT2.body,
      maxWidth: 440,
      letterSpacing: 0.3
    }
  }, "Low-fidelity house mixes", /*#__PURE__*/React.createElement("br", null), "from Cyberia Caf\xE9 & Club."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    kind: "primary",
    onClick: () => {
      const el = document.getElementById('wt-archive');
      if (el) window.scrollTo({
        top: el.offsetTop,
        behavior: 'smooth'
      });
    }
  }, "\u25B8 Listen to the Latest Mix"), /*#__PURE__*/React.createElement(Btn, {
    onClick: () => {
      const el = document.getElementById('wt-uplink');
      if (el) el.scrollIntoView({
        behavior: 'smooth'
      });
    }
  }, "Submit Your Track"))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...(narrow ? {
        position: 'relative',
        zIndex: 4,
        marginTop: 14,
        marginLeft: winW < 480 ? 20 : 40,
        marginRight: winW < 480 ? 20 : 40,
        width: 320,
        maxWidth: winW < 480 ? 'calc(100% - 40px)' : 'calc(100% - 80px)',
        alignSelf: 'flex-start'
      } : {
        position: 'absolute',
        right: 40,
        bottom: 52,
        zIndex: 4,
        width: 320
      }),
      background: 'rgba(7,8,9,0.72)',
      border: `1px solid ${WT2.line2}`,
      backdropFilter: 'blur(4px)',
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: WT2.mono,
      fontSize: 10,
      letterSpacing: 2,
      color: playing ? 'var(--wt-accent)' : WT2.faint
    }
  }, playing ? '◉ NOW DECODING' : '◎ STANDBY'), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: WT2.mono,
      fontSize: 10,
      color: WT2.faint
    }
  }, activeTxCode || 'TX-047')), /*#__PURE__*/React.createElement(Oscilloscope, {
    height: 80,
    color: "var(--wt-accent)",
    dense: 1.1,
    playing: playing,
    seeking: seeking
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: WT2.display,
      fontSize: 12,
      lineHeight: 1.3,
      color: playing ? WT2.ink : WT2.faint,
      marginBottom: 6
    }
  }, hasPlayed ? activeTitle || '— — —' : '— — —')), /*#__PURE__*/React.createElement(SeekBar, {
    progress: progress,
    onSeek: onSeek,
    height: 3,
    mt: 0,
    onSeekStateChange: onSeekStateChange
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: WT2.mono,
      fontSize: 10,
      color: WT2.dim
    }
  }, hasPlayed ? fmtTime(elapsed) : '--:--:--'), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: WT2.mono,
      fontSize: 10,
      color: WT2.faint
    }
  }, duration || '--:--:--'))));
}
function SignalFeed({ scene, onClose }) {
  const videoRef = React.useRef(null);
  const [playing, setPlaying] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [progress, setProgress] = React.useState(0);
  const [seeking, setSeeking] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const [hovVideo, setHovVideo] = React.useState(false);
  const [flashIcon, setFlashIcon] = React.useState(null);
  const [connected, setConnected] = React.useState(false);

  // Inject flash-fade keyframe once
  React.useEffect(() => {
    if (document.getElementById('wt-sf-kf')) return;
    var s = document.createElement('style');
    s.id = 'wt-sf-kf';
    s.textContent = '@keyframes wt-sf-flash{0%{opacity:0.9;transform:scale(1)}100%{opacity:0;transform:scale(1.5)}}';
    document.head.appendChild(s);
  }, []);

  React.useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.load();
    setPlaying(false); setElapsed(0); setProgress(0); setDuration(0);
    setExpanded(false); setConnected(false);
  }, [scene.id]);

  React.useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    function onTimeUpdate() {
      if (v.duration && isFinite(v.duration)) {
        setElapsed(Math.floor(v.currentTime));
        setProgress(v.currentTime / v.duration);
      }
    }
    function onLoadedMetadata() { if (isFinite(v.duration)) { setDuration(Math.floor(v.duration)); setConnected(true); } }
    function onPlay() { setPlaying(true); }
    function onPause() { setPlaying(false); }
    v.addEventListener('timeupdate', onTimeUpdate);
    v.addEventListener('loadedmetadata', onLoadedMetadata);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    return () => {
      v.pause();
      v.removeEventListener('timeupdate', onTimeUpdate);
      v.removeEventListener('loadedmetadata', onLoadedMetadata);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
    };
  }, []);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    const icon = playing ? 'pause' : 'play';
    if (playing) v.pause(); else v.play().catch(function() {});
    setFlashIcon(icon);
    setTimeout(function() { setFlashIcon(null); }, 550);
  }
  function seekTo(frac) {
    const v = videoRef.current;
    if (v && isFinite(v.duration)) v.currentTime = frac * v.duration;
  }
  function fmtT(s) {
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  }

  const wiredPath = 'WIRED://NODE.227/' + scene.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const epLabel = scene.episode != null ? 'EP.' + String(scene.episode).padStart(2, '0') : '';

  // Lock body scroll when fullscreen
  React.useEffect(function() {
    if (expanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return function() { document.body.style.overflow = ''; };
  }, [expanded]);

  const outerStyle = expanded ? {
    position: 'fixed', inset: 0, zIndex: 300,
    background: 'rgba(4,5,7,0.98)',
    display: 'flex', flexDirection: 'column', overflow: 'hidden'
  } : {
    marginTop: 24, border: '1px solid ' + WT2.line2,
    background: WT2.void, position: 'relative', overflow: 'hidden',
    maxWidth: 840
  };

  return /*#__PURE__*/React.createElement("div", { style: outerStyle },

    // ── HEADER ────────────────────────────────────────────────────────────
    /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '7px 14px', background: WT2.sink,
        borderBottom: '1px solid ' + WT2.line,
        width: '100%', boxSizing: 'border-box', gap: 10
      }
    },
      /*#__PURE__*/React.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 } },
        /*#__PURE__*/React.createElement("span", {
          className: playing ? 'wt-pulse' : '',
          style: {
            width: 6, height: 6, borderRadius: 3, flexShrink: 0,
            background: connected ? 'var(--wt-accent)' : WT2.faint,
            boxShadow: playing ? '0 0 8px var(--wt-accent)' : 'none',
            transition: 'background .4s, box-shadow .4s'
          }
        }),
        /*#__PURE__*/React.createElement("span", {
          style: {
            fontFamily: WT2.mono, fontSize: 9, letterSpacing: 2, whiteSpace: 'nowrap',
            color: connected ? (playing ? 'var(--wt-accent)' : WT2.dim) : WT2.faint,
            textShadow: playing ? '0 0 8px var(--wt-accent)' : 'none'
          }
        }, connected ? (playing ? 'SIGNAL ACTIVE' : 'SIGNAL READY') : '… ACQUIRING'),
        /*#__PURE__*/React.createElement("span", {
          style: {
            fontFamily: WT2.mono, fontSize: 8, letterSpacing: 0.5,
            color: WT2.faint, overflow: 'hidden', textOverflow: 'ellipsis',
            whiteSpace: 'nowrap', minWidth: 0, opacity: 0.65
          }
        }, wiredPath)
      ),
      /*#__PURE__*/React.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 } },
        /*#__PURE__*/React.createElement(Tag, { color: playing ? 'var(--wt-accent)' : WT2.faint }, scene.tag),
        /*#__PURE__*/React.createElement("button", {
          onClick: function() { setExpanded(function(e) { return !e; }); },
          style: {
            background: 'none', border: '1px solid ' + WT2.line, color: WT2.faint,
            fontFamily: WT2.mono, fontSize: 8.5, letterSpacing: 1.5, padding: '4px 10px',
            cursor: 'pointer', borderRadius: 0, textTransform: 'uppercase', transition: 'all .12s'
          }
        }, expanded ? '⊟ COLLAPSE' : '⊞ FULLSCREEN'),
        /*#__PURE__*/React.createElement("button", {
          onClick: onClose,
          style: {
            background: 'none', border: '1px solid ' + WT2.line2, color: WT2.faint,
            fontFamily: WT2.mono, fontSize: 8.5, letterSpacing: 1.5, padding: '4px 10px',
            cursor: 'pointer', borderRadius: 0, textTransform: 'uppercase', transition: 'all .12s'
          }
        }, '× DISCONNECT')
      )
    ),

    // ── VIDEO ─────────────────────────────────────────────────────────────
    /*#__PURE__*/React.createElement("div", {
      style: expanded ? {
        position: 'relative', flex: 1, minHeight: 0, width: '100%',
        background: '#000', overflow: 'hidden', cursor: 'pointer'
      } : {
        position: 'relative', width: '100%',
        aspectRatio: '16/9', background: '#000', overflow: 'hidden', cursor: 'pointer'
      },
      onClick: togglePlay,
      onMouseEnter: function() { setHovVideo(true); },
      onMouseLeave: function() { setHovVideo(false); }
    },
      /*#__PURE__*/React.createElement("video", {
        ref: videoRef, src: scene.video, poster: scene.img,
        muted: true, playsInline: true, loop: true, preload: "metadata",
        style: { width: '100%', height: '100%', display: 'block', objectFit: 'cover', background: '#000' }
      }),
      // Heavy CRT scanlines
      /*#__PURE__*/React.createElement("div", { 'aria-hidden': true, style: {
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.38) 0 1px, transparent 1px 3px)',
        mixBlendMode: 'multiply'
      }}),
      // Vignette
      /*#__PURE__*/React.createElement("div", { 'aria-hidden': true, style: {
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 90% 90% at 50% 50%, transparent 45%, rgba(0,0,0,0.72) 100%)'
      }}),
      // Corner ticks
      /*#__PURE__*/React.createElement(FrameTicks, { inset: 12, len: 20, color: 'rgba(143,191,159,0.45)' }),
      // Top-left node readout
      /*#__PURE__*/React.createElement("div", { 'aria-hidden': true, style: {
        position: 'absolute', top: 14, left: 16,
        fontFamily: WT2.mono, fontSize: 8.5, letterSpacing: 2,
        color: 'rgba(143,191,159,0.6)', lineHeight: 2, pointerEvents: 'none'
      }},
        /*#__PURE__*/React.createElement("div", null, 'NODE.227'),
        epLabel && /*#__PURE__*/React.createElement("div", null, epLabel)
      ),
      // Bottom-right timestamp
      /*#__PURE__*/React.createElement("div", { 'aria-hidden': true, style: {
        position: 'absolute', bottom: 14, right: 16,
        fontFamily: WT2.mono, fontSize: 8.5, letterSpacing: 1.5,
        color: 'rgba(143,191,159,0.6)', pointerEvents: 'none'
      }}, fmtT(elapsed) + ' / ' + (duration ? fmtT(duration) : '--:--')),
      // Flash icon on click
      flashIcon && /*#__PURE__*/React.createElement("div", { 'aria-hidden': true, style: {
        position: 'absolute', inset: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
        animation: 'wt-sf-flash 0.55s ease-out forwards'
      }},
        /*#__PURE__*/React.createElement("span", { style: {
          fontFamily: WT2.mono, fontSize: expanded ? 72 : 52,
          color: 'var(--wt-accent)', lineHeight: 1,
          textShadow: '0 0 40px var(--wt-accent), 0 0 80px var(--wt-accent)'
        }}, flashIcon === 'play' ? '▸' : '▐▐')
      ),
      // Pause / hover overlay
      /*#__PURE__*/React.createElement("div", { 'aria-hidden': true, style: {
        position: 'absolute', inset: 0, display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: playing
          ? (hovVideo ? 'rgba(0,0,0,0.18)' : 'transparent')
          : 'rgba(0,0,0,0.5)',
        opacity: playing ? (hovVideo ? 1 : 0) : 1,
        transition: 'opacity .22s, background .22s',
        pointerEvents: 'none', gap: 10
      }},
        !playing && /*#__PURE__*/React.createElement("span", { style: {
          fontFamily: WT2.mono, fontSize: expanded ? 72 : 52, lineHeight: 1,
          color: 'var(--wt-accent)',
          textShadow: '0 0 32px var(--wt-accent), 0 0 64px var(--wt-accent)'
        }}, '▸'),
        !playing && /*#__PURE__*/React.createElement("span", { style: {
          fontFamily: WT2.mono, fontSize: 10, letterSpacing: 4,
          color: 'var(--wt-accent)', textShadow: '0 0 12px var(--wt-accent)'
        }}, connected ? 'TRANSMIT SIGNAL' : 'ACQUIRING SIGNAL…'),
        playing && hovVideo && /*#__PURE__*/React.createElement("span", { style: {
          fontFamily: WT2.mono, fontSize: 11, letterSpacing: 3,
          color: 'rgba(230,225,212,0.55)'
        }}, '▐▐  SUSPEND SIGNAL')
      )
    ),

    // ── CONTROL BAR ───────────────────────────────────────────────────────
    /*#__PURE__*/React.createElement("div", {
      style: {
        width: '100%', boxSizing: 'border-box',
        background: WT2.sink, borderTop: '1px solid ' + WT2.line2,
        padding: '14px 16px 16px'
      }
    },
      // Scene name + description
      /*#__PURE__*/React.createElement("div", { style: { marginBottom: 12 } },
        /*#__PURE__*/React.createElement("div", {
          style: {
            fontFamily: WT2.display, fontSize: 19, color: WT2.ink,
            lineHeight: 1.2, marginBottom: 6
          }
        }, scene.name),
        scene.desc && /*#__PURE__*/React.createElement("p", {
          style: {
            margin: 0, fontFamily: WT2.mono, fontSize: 10.5, color: WT2.faint,
            lineHeight: 1.65, letterSpacing: 0.2
          }
        }, scene.desc)
      ),
      // Seekbar
      /*#__PURE__*/React.createElement(SeekBar, {
        progress: progress, onSeek: seekTo, height: 2, mt: 0, onSeekStateChange: setSeeking
      }),
      // Bottom row
      /*#__PURE__*/React.createElement("div", {
        style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 7 }
      },
        /*#__PURE__*/React.createElement("span", {
          style: { fontFamily: WT2.mono, fontSize: 9, letterSpacing: 1.5, color: WT2.faint }
        }, fmtT(elapsed) + '  ·  ' + (duration ? fmtT(duration) : '--:--') + '  ·  ∞ LOOP'),
        /*#__PURE__*/React.createElement("button", {
          onClick: togglePlay,
          style: {
            background: playing ? 'none' : 'var(--wt-accent)',
            border: '1px solid var(--wt-accent)',
            color: playing ? 'var(--wt-accent)' : WT2.void,
            fontFamily: WT2.mono, fontSize: 9, letterSpacing: 2.5,
            padding: '5px 0', width: 110, textAlign: 'center',
            cursor: 'pointer', borderRadius: 0,
            textTransform: 'uppercase', transition: 'all .12s',
            textShadow: playing ? '0 0 8px var(--wt-accent)' : 'none'
          }
        }, playing ? '▐▐ SUSPEND' : '▸ TRANSMIT')
      )
    )
  );
}
function SceneCard({
  name,
  tag,
  desc,
  img,
  selected,
  onSelect
}) {
  const [hov, setHov] = React.useState(false);
  const active = selected || hov;
  return /*#__PURE__*/React.createElement("div", {
    onClick: onSelect,
    onMouseEnter: () => setHov(true),
    onMouseLeave: () => setHov(false),
    style: {
      cursor: 'pointer',
      border: `1px solid ${active ? 'var(--wt-accent)' : WT2.line}`,
      background: active ? 'rgba(143,191,159,0.06)' : 'rgba(7,8,9,0.4)',
      padding: '20px 20px',
      position: 'relative',
      transition: 'border-color .2s, background .2s, box-shadow .2s',
      boxShadow: active ? '0 0 16px rgba(143,191,159,0.10)' : 'none'
    }
  }, active && /*#__PURE__*/React.createElement(FrameTicks, {
    inset: 8,
    len: 10,
    color: "var(--wt-accent)"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 100,
      background: WT2.fill,
      border: `1px solid ${WT2.line2}`,
      marginBottom: 14,
      position: 'relative',
      overflow: 'hidden'
    }
  }, img && /*#__PURE__*/React.createElement("img", {
    src: img,
    alt: "",
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: 'block'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0 1px, transparent 1px 3px)'
    }
  }), !img && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      bottom: 8,
      left: 10,
      fontFamily: WT2.mono,
      fontSize: 9,
      letterSpacing: 1,
      color: WT2.faint
    }
  }, "[ scene \xB7 placeholder ]"), selected && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 8,
      height: 8,
      borderRadius: 4,
      background: 'var(--wt-accent)',
      boxShadow: '0 0 8px var(--wt-accent)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontFamily: WT2.display,
      fontSize: 17,
      fontWeight: 700,
      color: active ? WT2.ink : WT2.body,
      transition: 'color .2s',
      lineHeight: 1.2,
      marginBottom: 6
    }
  }, name), /*#__PURE__*/React.createElement(Tag, {
    color: active ? 'var(--wt-accent)' : WT2.faint
  }, tag)), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: WT2.mono,
      fontSize: 11,
      lineHeight: 1.65,
      color: WT2.dim,
      letterSpacing: 0.2
    }
  }, desc));
}
function SceneGrid() {
  const SCENES_PER_PAGE = 6;
  const [selected, setSelected] = React.useState(null);
  const [page, setPage] = React.useState(0);
  const [epFilter, setEpFilter] = React.useState(null);
  const winW = useWinW();
  const cols = winW >= 1000 ? 3 : winW >= 700 ? 2 : 1;
  const SCENES = (window.__WT_SCENES || []).map(function(s) {
    return {
      id: s.id,
      name: s.name,
      tag: s.type,
      desc: s.description,
      img: '/' + s.thumbnailPath,
      video: '/' + s.videoPath,
      episode: s.episodeNumber,
    };
  });
  const episodes = SCENES.reduce(function(acc, s) {
    if (s.episode != null && !acc.includes(s.episode)) acc.push(s.episode);
    return acc;
  }, []).sort(function(a, b) { return a - b; });
  const filtered = epFilter != null ? SCENES.filter(function(s) { return s.episode === epFilter; }) : SCENES;
  const totalPages = Math.max(1, Math.ceil(filtered.length / SCENES_PER_PAGE));
  const visible = filtered.slice(page * SCENES_PER_PAGE, (page + 1) * SCENES_PER_PAGE);
  const sel = filtered.find(s => s.id === selected);
  function goPage(next) {
    setPage(next);
    setSelected(null);
    const el = document.getElementById('wt-signal');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function setEp(ep) {
    setEpFilter(function(prev) { return prev === ep ? null : ep; });
    setPage(0);
    setSelected(null);
  }
  return /*#__PURE__*/React.createElement("div", null,
  /*#__PURE__*/React.createElement("div", {
    style: { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap', overflowX: 'auto', marginBottom: 20, paddingBottom: 4 }
  }, /*#__PURE__*/React.createElement("span", {
    style: { fontFamily: WT2.mono, fontSize: 10, color: WT2.faint, letterSpacing: 1.5, marginRight: 2 }
  }, "EP:"), ['all'].concat(episodes).map(function(ep) {
    const isAll = ep === 'all';
    const active = isAll ? epFilter == null : epFilter === ep;
    return /*#__PURE__*/React.createElement("button", {
      key: ep,
      onClick: function() { isAll ? (setEpFilter(null), setPage(0), setSelected(null)) : setEp(ep); },
      style: {
        background: active ? 'var(--wt-accent)' : 'none',
        border: '1px solid ' + (active ? 'var(--wt-accent)' : WT2.line),
        color: active ? WT2.void : WT2.dim,
        fontFamily: WT2.mono, fontSize: 9.5, letterSpacing: 1,
        padding: '3px 9px', cursor: 'pointer', borderRadius: 0,
        transition: 'all .12s'
      }
    }, isAll ? 'ALL' : 'EP ' + String(ep).padStart(2, '0'));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: WT2.mono,
      fontSize: 10,
      letterSpacing: 2,
      color: sel ? 'var(--wt-accent)' : WT2.faint,
      transition: 'color .2s',
      whiteSpace: 'nowrap',
      textShadow: sel ? '0 0 8px var(--wt-accent)' : 'none'
    }
  }, sel ? 'SELECTED SIGNAL: ' + sel.name.toUpperCase() : 'SELECT A SIGNAL ↓')), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(' + cols + ', 1fr)',
      gap: 16,
      minHeight: 300,
      alignContent: 'start'
    }
  }, visible.map(s => /*#__PURE__*/React.createElement(SceneCard, {
    key: s.id,
    name: s.name,
    tag: s.tag,
    desc: s.desc,
    img: s.img,
    selected: selected === s.id,
    onSelect: () => setSelected(selected === s.id ? null : s.id)
  }))), sel ? /*#__PURE__*/React.createElement(SignalFeed, {
    key: sel.id,
    scene: sel,
    onClose: function() { setSelected(null); }
  }) : null, /*#__PURE__*/React.createElement(TermPageBar, {
    page: page,
    total: totalPages,
    onGoTo: goPage
  }));
}
function Features() {
  const winW = useWinW();
  const narrow = winW < 900;
  return /*#__PURE__*/React.createElement("section", {
    id: "wt-signal",
    style: {
      padding: narrow ? '52px 24px' : '72px 56px',
      borderBottom: `1px solid ${WT2.line}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: narrow ? 32 : 44
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: WT2.mono,
      fontSize: 10.5,
      color: 'var(--wt-accent)',
      letterSpacing: 1
    }
  }, "\u258C"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: WT2.mono,
      fontSize: 10.5,
      color: 'var(--wt-accent)',
      letterSpacing: 2.5
    }
  }, "MODULE .02"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: WT2.mono,
      fontSize: 10.5,
      color: WT2.faint,
      letterSpacing: 2.5
    }
  }, "// SCENES")), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: '0 0 10px',
      fontFamily: WT2.display,
      fontWeight: 800,
      fontSize: 'clamp(26px, 5vw, 42px)',
      lineHeight: 1.1,
      color: WT2.ink,
      letterSpacing: 0
    }
  }, "Select Transmission Environment"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: WT2.mono,
      fontSize: 13,
      lineHeight: 1.65,
      color: WT2.dim,
      maxWidth: 460,
      letterSpacing: 0.3
    }
  }, "Choose a visual scene to pair with the current mix.")), /*#__PURE__*/React.createElement(SceneGrid, null));
}
Object.assign(window, {
  useWinW,
  Rail,
  Hero,
  Features,
  SeekBar,
  RAIL_W,
  RAIL_W_NARROW
});