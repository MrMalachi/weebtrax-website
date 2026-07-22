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
function useWinH() {
  const [h, setH] = React.useState(typeof window !== 'undefined' ? window.innerHeight : 900);
  React.useEffect(() => {
    const handler = () => setH(window.innerHeight);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return h;
}
const MOBILE_MQ = '(max-width: 599px)';
function useIsMobile() {
  const [mobile, setMobile] = React.useState(() => window.matchMedia(MOBILE_MQ).matches);
  React.useEffect(() => {
    const mql = window.matchMedia(MOBILE_MQ);
    const handler = e => setMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);
  return mobile;
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
  const [hovWT, setHovWT] = React.useState(false);
  const wtTimerRef = React.useRef(null);
  const winW = useWinW();
  const compact = winW < 900;
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
    className: 'wt-rail',
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
    onMouseEnter: function() { setHovWT(true); },
    onMouseLeave: function() { setHovWT(false); },
    onClick: function() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setHovWT(true);
      if (wtTimerRef.current) clearTimeout(wtTimerRef.current);
      wtTimerRef.current = setTimeout(function() { setHovWT(false); }, 1500);
    },
    style: {
      width: compact ? 28 : 42,
      height: compact ? 28 : 42,
      border: hovWT ? '1px solid var(--wt-accent)' : `1px solid ${WT2.line2}`,
      boxShadow: hovWT ? '0 0 18px rgba(143,191,159,0.28), inset 0 0 10px rgba(143,191,159,0.06)' : 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      background: hovWT ? 'rgba(143,191,159,0.07)' : 'rgba(143,191,159,0.03)',
      flexShrink: 0,
      cursor: 'pointer',
      transition: 'border-color 0.2s, box-shadow 0.25s, background 0.2s'
    }
  }, !compact && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 3,
      left: 3,
      width: hovWT ? 9 : 6,
      height: hovWT ? 9 : 6,
      borderTop: `1px solid ${WT2.green}`,
      borderLeft: `1px solid ${WT2.green}`,
      opacity: hovWT ? 1 : 0.7,
      transition: 'width 0.2s, height 0.2s, opacity 0.2s'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 3,
      right: 3,
      width: hovWT ? 9 : 6,
      height: hovWT ? 9 : 6,
      borderBottom: `1px solid ${WT2.green}`,
      borderRight: `1px solid ${WT2.green}`,
      opacity: hovWT ? 1 : 0.7,
      transition: 'width 0.2s, height 0.2s, opacity 0.2s'
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: WT2.mono,
      fontWeight: 700,
      fontSize: compact ? 9 : 12,
      letterSpacing: 1,
      color: WT2.green,
      textShadow: hovWT
        ? `0 0 6px ${WT2.green}, 0 0 18px ${WT2.green}, 0 0 36px rgba(143,191,159,0.4)`
        : `0 0 10px ${WT2.green}`,
      transition: 'text-shadow 0.2s'
    }
  }, "WT")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: rW + 10,
      top: compact ? 7 : 13,
      opacity: hovWT ? 1 : 0,
      transform: hovWT ? 'translateX(0)' : 'translateX(-8px)',
      transition: 'opacity 0.2s, transform 0.2s',
      pointerEvents: 'none',
      fontFamily: WT2.mono,
      fontSize: 8.5,
      letterSpacing: 2.5,
      color: 'var(--wt-accent)',
      background: 'rgba(7,8,9,0.92)',
      border: `1px solid ${WT2.line2}`,
      padding: '5px 10px',
      whiteSpace: 'nowrap',
      zIndex: 201,
      backdropFilter: 'blur(4px)'
    }
  }, "// WEEBTRAX"), /*#__PURE__*/React.createElement("nav", {
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
  }, t)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "wt-pulse",
    style: {
      width: compact ? 5 : 7,
      height: compact ? 5 : 7,
      borderRadius: 5,
      background: 'var(--wt-accent)',
      boxShadow: '0 0 8px var(--wt-accent)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: WT2.mono,
      fontSize: compact ? 7 : 8.5,
      letterSpacing: compact ? 0.5 : 1,
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
  const localFracRef = React.useRef(null);
  const [seeking, setSeeking] = React.useState(false);
  const [localPct, setLocalPct] = React.useState(null);
  function getFraction(e) {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  }
  function onPointerDown(e) {
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingRef.current = true;
    const frac = getFraction(e);
    localFracRef.current = frac;
    setLocalPct(frac);
    setSeeking(true);
    if (onSeekStateChange) onSeekStateChange(true);
    if (onSeek) onSeek(frac);
  }
  function onPointerMove(e) {
    if (!draggingRef.current) return;
    // Update visual position only — no audio seek on every frame
    const frac = getFraction(e);
    localFracRef.current = frac;
    setLocalPct(frac);
  }
  function onPointerUp(e) {
    if (!draggingRef.current) return;
    const frac = getFraction(e);
    draggingRef.current = false;
    localFracRef.current = null;
    setLocalPct(null);
    setSeeking(false);
    if (onSeekStateChange) onSeekStateChange(false);
    if (onSeek) onSeek(frac);
  }
  function onPointerCancel() {
    if (!draggingRef.current) return;
    const frac = localFracRef.current;
    draggingRef.current = false;
    localFracRef.current = null;
    setLocalPct(null);
    setSeeking(false);
    if (onSeekStateChange) onSeekStateChange(false);
    if (onSeek && frac !== null) onSeek(frac);
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
  // Display: localPct tracks pointer during drag; falls back to audio progress
  const pct = (localPct !== null ? localPct : (progress || 0)) * 100;
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
    onPointerCancel: onPointerCancel,
    onKeyDown: onKeyDown,
    style: {
      marginTop: mt,
      paddingTop: 9,
      paddingBottom: 9,
      cursor: onSeek ? 'pointer' : 'default',
      outline: 'none',
      touchAction: 'none'
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
  const isMobile = useIsMobile();
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
      paddingTop: narrow ? 80 : undefined,
      paddingBottom: narrow ? 52 : undefined
    }
  }, /*#__PURE__*/React.createElement("img", {
    className: "wt-hero-head-mobile",
    src: "public/assets/images/hero-head-mobile.png",
    alt: "",
    "aria-hidden": true
  }), /*#__PURE__*/React.createElement("span", {
    className: "wt-hero-head-say",
    "aria-hidden": true
  }, "私は私よ。"), /*#__PURE__*/React.createElement("img", {
    className: "wt-hero-crowd-mobile",
    src: "public/assets/images/hero-crowd-mobile.png",
    alt: "",
    "aria-hidden": true
  }), !isMobile && /*#__PURE__*/React.createElement("div", {
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
    color: WT2.line2,
    bottomClassName: "wt-hero-bottom-bracket"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 32,
      left: 36,
      right: 36,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "wt-hero-status-text",
    style: {
      fontFamily: WT2.mono,
      fontSize: 11.5,
      color: WT2.body,
      letterSpacing: 0.5
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "wt-hero-status-path"
  }, "wired://weebtrax/connect \xA0\u2014\xA0 "), "status: ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--wt-accent)'
    }
  }, "ONLINE"), /*#__PURE__*/React.createElement(Cursor, null)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: WT2.mono,
      fontSize: isMobile ? 10.5 : 11.5,
      color: isMobile ? WT2.body : WT2.dim,
      letterSpacing: 1,
      display: 'flex',
      gap: 18
    }
  }, !isMobile && /*#__PURE__*/React.createElement("span", null, "\u2301 44.1kHz"), /*#__PURE__*/React.createElement("span", {
    style: isMobile ? { textShadow: '0 1px 6px rgba(0,0,0,0.95), 0 0 12px rgba(0,0,0,0.8)' } : {}
  }, clock))), /*#__PURE__*/React.createElement("div", {
    className: "wt-hero-text",
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
    className: "wt-hero-module",
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
    className: "wt-hero-tagline",
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
  }, "Low-Fidelity House mixes", /*#__PURE__*/React.createElement("br", null), "from Cyberia Caf\xE9 & Club."), /*#__PURE__*/React.createElement("div", {
    className: "wt-hero-cta",
    style: {
      display: 'flex',
      gap: 14,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    kind: "primary",
    onClick: () => {
      const el = document.getElementById('wt-archive');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", { style: { fontSize: 13, lineHeight: 1, marginRight: -4 } }, "\u25B6"), "Listen to the Latest Mix")), /*#__PURE__*/React.createElement(Btn, {
    onClick: () => {
      const el = document.getElementById('wt-uplink');
      if (el) el.scrollIntoView({
        behavior: 'smooth'
      });
    }
  }, "Submit Your Track"))), /*#__PURE__*/React.createElement("div", {
    className: "wt-hero-player",
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
  }, activeTxCode || 'TX-047')), /*#__PURE__*/React.createElement("div", { className: "wt-hero-osc" }, /*#__PURE__*/React.createElement(Oscilloscope, {
    height: 80,
    color: "var(--wt-accent)",
    dense: 1.1,
    playing: playing,
    seeking: seeking
  })), /*#__PURE__*/React.createElement("div", {
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
function SignalFeed({ scene, onClose, onPrev, onNext }) {
  const videoRef = React.useRef(null);
  const [playing, setPlaying] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const [hovVideo, setHovVideo] = React.useState(false);
  const [flashIcon, setFlashIcon] = React.useState(null);
  const [connected, setConnected] = React.useState(false);
  const [ctrlVisible, setCtrlVisible] = React.useState(true);
  const hideTimerRef = React.useRef(null);
  const winW = useWinW();
  const winH = useWinH();
  const narrow = useIsMobile();
  const landscape = winH < 430 && winW > winH;

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
    // Preserve expanded (fullscreen) state across prev/next navigation
    setPlaying(false); setConnected(false);
  }, [scene.id]);

  React.useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    function onLoadedMetadata() { setConnected(true); }
    function onPlay() { setPlaying(true); }
    function onPause() { setPlaying(false); }
    v.addEventListener('loadedmetadata', onLoadedMetadata);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    return () => {
      v.pause();
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

  function bumpControls() {
    setCtrlVisible(true);
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(function() { setCtrlVisible(false); }, 3000);
  }


  const wiredPath = 'WIRED://NODE.227/' + scene.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const epLabel = scene.episode != null ? 'EP.' + String(scene.episode).padStart(2, '0') : '';

  // Lock body scroll when fullscreen
  React.useEffect(function() {
    if (expanded) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return function() {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [expanded]);

  // Auto-hide controls in fullscreen mobile — start timer on enter, clear on exit
  React.useEffect(function() {
    if (expanded && narrow) { bumpControls(); }
    else { clearTimeout(hideTimerRef.current); setCtrlVisible(true); }
    return function() { clearTimeout(hideTimerRef.current); };
  }, [expanded, narrow]);

  // When paused, always show controls so the play button is visible
  React.useEffect(function() {
    if (!playing && expanded && narrow) {
      clearTimeout(hideTimerRef.current);
      setCtrlVisible(true);
    }
  }, [playing, expanded, narrow]);

  const outerStyle = expanded ? {
    position: 'fixed', inset: 0, zIndex: 300,
    background: 'rgba(4,5,7,0.98)',
    display: 'flex', flexDirection: 'column', overflow: 'hidden'
  } : {
    marginTop: 24, border: '1px solid ' + WT2.line2,
    background: WT2.void, position: 'relative', overflow: 'hidden',
    maxWidth: narrow ? '100%' : 840
  };

  const ctrlFade = (expanded && narrow && !ctrlVisible);
  return /*#__PURE__*/React.createElement("div", { style: outerStyle, onPointerDown: (expanded && narrow) ? bumpControls : undefined },

    // ── HEADER ────────────────────────────────────────────────────────────
    /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '7px 14px', background: WT2.sink,
        borderBottom: '1px solid ' + WT2.line,
        width: '100%', boxSizing: 'border-box', gap: 10,
        opacity: ctrlFade ? 0 : 1, transition: 'opacity 0.3s',
        pointerEvents: ctrlFade ? 'none' : undefined
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
            fontFamily: WT2.mono, fontSize: 8, letterSpacing: 1.5,
            color: WT2.faint, whiteSpace: 'nowrap', flexShrink: 0,
            textTransform: 'uppercase', opacity: 0.7
          }
        }, scene.tag),
        !narrow && /*#__PURE__*/React.createElement("span", {
          style: {
            fontFamily: WT2.mono, fontSize: 8, letterSpacing: 0.5,
            color: WT2.faint, overflow: 'hidden', textOverflow: 'ellipsis',
            whiteSpace: 'nowrap', minWidth: 0, opacity: 0.45
          }
        }, wiredPath)
      ),
      /*#__PURE__*/React.createElement("div", { style: { display: (narrow || landscape) ? 'none' : 'flex', alignItems: 'center', gap: 8, flexShrink: 0 } },
        /*#__PURE__*/React.createElement("button", {
          onClick: function() { setExpanded(function(e) { return !e; }); },
          style: {
            background: expanded ? 'rgba(143,191,159,0.1)' : 'none',
            border: '1px solid var(--wt-accent)', color: 'var(--wt-accent)',
            fontFamily: WT2.mono, fontSize: narrow ? 9 : 9, letterSpacing: 1.5,
            padding: narrow ? '6px 10px' : '5px 12px',
            cursor: 'pointer', borderRadius: 0, textTransform: 'uppercase', transition: 'all .12s',
            textShadow: '0 0 8px var(--wt-accent)', minWidth: narrow ? 36 : undefined,
            textAlign: 'center'
          }
        }, narrow ? (expanded ? '⊟' : '⊞') : (expanded ? '⊟ COLLAPSE' : '⊞ FULLSCREEN')),
        /*#__PURE__*/React.createElement("button", {
          onClick: onClose,
          style: {
            background: 'none', border: '1px solid ' + WT2.red, color: WT2.red,
            fontFamily: WT2.mono, fontSize: narrow ? 9 : 9, letterSpacing: 1.5,
            padding: narrow ? '6px 10px' : '5px 12px',
            cursor: 'pointer', borderRadius: 0, textTransform: 'uppercase', transition: 'all .12s',
            minWidth: narrow ? 36 : undefined, textAlign: 'center'
          }
        }, narrow ? '×' : '× DISCONNECT')
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
        ref: videoRef, src: scene.video + '?v=3', poster: scene.img,
        muted: true, playsInline: true, loop: true, preload: "auto",
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
        position: 'absolute', top: 22, left: 26,
        fontFamily: WT2.mono, fontSize: 8.5, letterSpacing: 2,
        color: 'rgba(143,191,159,0.6)', lineHeight: 2, pointerEvents: 'none'
      }},
        /*#__PURE__*/React.createElement("div", null, 'NODE.227'),
        epLabel && /*#__PURE__*/React.createElement("div", null, epLabel)
      ),
      // Bottom-right loop indicator
      /*#__PURE__*/React.createElement("div", { 'aria-hidden': true, style: {
        position: 'absolute', bottom: 22, right: 26,
        fontFamily: WT2.mono, fontSize: 8.5, letterSpacing: 1.5,
        color: 'rgba(143,191,159,0.6)', pointerEvents: 'none'
      }}, '∞ LOOP'),
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
          fontFamily: WT2.mono, fontSize: narrow ? 9 : 10, letterSpacing: narrow ? 2 : 4,
          color: 'var(--wt-accent)', textShadow: '0 0 12px var(--wt-accent)'
        }}, connected ? 'TRANSMIT SIGNAL' : 'ACQUIRING SIGNAL…'),
        playing && hovVideo && !narrow && /*#__PURE__*/React.createElement("span", { style: {
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
        padding: narrow ? '10px 12px 12px' : '14px 16px 16px',
        opacity: ctrlFade ? 0 : 1, transition: 'opacity 0.3s',
        pointerEvents: ctrlFade ? 'none' : undefined
      }
    },
      // Scene name + description
      /*#__PURE__*/React.createElement("div", { style: { marginBottom: narrow ? 8 : 12 } },
        /*#__PURE__*/React.createElement("div", {
          style: {
            fontFamily: WT2.display, fontSize: narrow ? 15 : 19, color: WT2.ink,
            lineHeight: 1.2, marginBottom: 4
          }
        }, scene.name),
        scene.desc && !narrow && /*#__PURE__*/React.createElement("p", {
          style: {
            margin: 0, fontFamily: WT2.mono, fontSize: 10.5, color: WT2.faint,
            lineHeight: 1.65, letterSpacing: 0.2
          }
        }, scene.desc)
      ),
      // Bottom row
      /*#__PURE__*/React.createElement("div", {
        style: { display: 'flex', alignItems: 'center', justifyContent: (narrow || landscape) ? 'space-between' : 'flex-end', marginTop: narrow ? 5 : 7 }
      },
        // Mobile/landscape bottom bar: [× close] [⊞ expand] — in landscape these replace the header buttons
        (narrow || landscape) && /*#__PURE__*/React.createElement("div", {
          style: { display: 'flex', alignItems: 'center', gap: 6 }
        },
          /*#__PURE__*/React.createElement("button", {
            className: 'wt-sf-mobile-btn',
            onClick: onClose,
            style: {
              background: 'none', border: '1px solid ' + WT2.red, color: WT2.red,
              fontFamily: WT2.mono, fontSize: 9, letterSpacing: 1.5,
              padding: '12px 16px', cursor: 'pointer', borderRadius: 0,
              textTransform: 'uppercase', transition: 'all .12s',
              WebkitTapHighlightColor: 'transparent', outline: 'none'
            }
          }, '\u00d7'),
          /*#__PURE__*/React.createElement("button", {
            className: 'wt-sf-mobile-btn',
            onClick: function() { setExpanded(function(e) { return !e; }); },
            style: {
              background: expanded ? 'rgba(143,191,159,0.1)' : 'none',
              border: '1px solid var(--wt-accent)', color: 'var(--wt-accent)',
              fontFamily: WT2.mono, fontSize: 9, letterSpacing: 1.5,
              padding: '12px 16px', cursor: 'pointer', borderRadius: 0,
              textTransform: 'uppercase', transition: 'all .12s',
              textShadow: '0 0 8px var(--wt-accent)',
              WebkitTapHighlightColor: 'transparent', outline: 'none'
            }
          }, expanded ? '\u229f' : '\u229e')
        ),
        /*#__PURE__*/React.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: 6 } },
          /*#__PURE__*/React.createElement("button", {
            className: 'wt-page-btn',
            onClick: onPrev || undefined,
            title: 'Previous scene',
            style: {
              background: 'none',
              border: '1px solid ' + (onPrev ? WT2.line2 : WT2.line),
              color: onPrev ? WT2.dim : WT2.faint,
              opacity: onPrev ? 1 : 0.3,
              fontFamily: WT2.mono, fontSize: 9, letterSpacing: 1.5,
              padding: (narrow || landscape) ? '12px 16px' : '5px 10px',
              cursor: onPrev ? 'pointer' : 'default', borderRadius: 0,
              textTransform: 'uppercase', transition: 'none',
              WebkitTapHighlightColor: 'transparent', outline: 'none'
            }
          }, '\u2190'),
          /*#__PURE__*/React.createElement("button", {
            className: (narrow || landscape) ? 'wt-sf-mobile-btn' : undefined,
            onClick: togglePlay,
            style: {
              background: playing ? 'none' : 'var(--wt-accent)',
              border: '1px solid var(--wt-accent)',
              color: playing ? 'var(--wt-accent)' : WT2.void,
              fontFamily: WT2.mono, fontSize: 9, letterSpacing: 2.5,
              padding: (narrow || landscape) ? '12px 0' : '5px 0', width: (narrow || landscape) ? 90 : 110, textAlign: 'center',
              cursor: 'pointer', borderRadius: 0, display: 'inline-flex',
              alignItems: 'center', justifyContent: 'center', gap: 6,
              textTransform: 'uppercase', transition: 'all .12s',
              textShadow: playing ? '0 0 8px var(--wt-accent)' : 'none',
              WebkitTapHighlightColor: 'transparent'
            }
          },
          /*#__PURE__*/React.createElement("span", { style: { fontSize: playing ? 7 : 12, lineHeight: 1, letterSpacing: 0 } }, playing ? '\u258e\u258e' : '\u25b8'),
          playing ? 'SUSPEND' : 'TRANSMIT'
          ),
          /*#__PURE__*/React.createElement("button", {
            className: 'wt-page-btn',
            onClick: onNext || undefined,
            title: 'Next scene',
            style: {
              background: 'none',
              border: '1px solid ' + (onNext ? WT2.line2 : WT2.line),
              color: onNext ? WT2.dim : WT2.faint,
              opacity: onNext ? 1 : 0.3,
              fontFamily: WT2.mono, fontSize: 9, letterSpacing: 1.5,
              padding: (narrow || landscape) ? '12px 16px' : '5px 10px',
              cursor: onNext ? 'pointer' : 'default', borderRadius: 0,
              textTransform: 'uppercase', transition: 'none',
              WebkitTapHighlightColor: 'transparent', outline: 'none'
            }
          }, '\u2192')
        )
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
    className: 'wt-scene-card',
    onClick: onSelect,
    onMouseEnter: () => setHov(true),
    onMouseLeave: () => setHov(false),
    role: "button",
    tabIndex: 0,
    onKeyDown: function(e) { if (e.key === 'Enter') { e.preventDefault(); onSelect(); } },
    'aria-label': 'Open scene: ' + name,
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
    className: 'wt-scene-thumb',
    style: {
      aspectRatio: '16/9',
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
    className: 'wt-scene-desc',
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
  const [selected, setSelected] = React.useState(null);
  const [page, setPage] = React.useState(0);
  const [epFilter, setEpFilter] = React.useState(null);
  const touchXRef = React.useRef(null);
  const epScrollRef = React.useRef(null);
  const epFadeLeftRef = React.useRef(null);
  const winW = useWinW();
  const SCENES_PER_PAGE = 4;
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
  const selIdx = sel ? filtered.indexOf(sel) : -1;
  const playerRef = React.useRef(null);
  React.useEffect(function() {
    if (selected && playerRef.current) {
      var el = playerRef.current;
      if (window.matchMedia(MOBILE_MQ).matches) {
        var rect = el.getBoundingClientRect();
        var targetTop = window.innerHeight * 0.3;
        window.scrollTo({ top: Math.max(0, window.scrollY + rect.top - targetTop), behavior: 'smooth' });
      } else {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [selected]);
  function navScene(nextScene) {
    const newIdx = filtered.indexOf(nextScene);
    const newPage = Math.floor(newIdx / SCENES_PER_PAGE);
    if (newPage !== page) setPage(newPage);
    setSelected(nextScene.id);
  }
  function goPage(next) {
    setPage(next);
    setSelected(null);
  }
  function setEp(ep) {
    setEpFilter(function(prev) { return prev === ep ? null : ep; });
    setPage(0);
    setSelected(null);
  }
  return /*#__PURE__*/React.createElement("div", null,
  /*#__PURE__*/React.createElement("div", { className: 'wt-ep-scroll-wrap', style: { position: 'relative', marginBottom: 20 } },
  /*#__PURE__*/React.createElement("div", {
    className: 'wt-ep-scroll',
    ref: epScrollRef,
    onScroll: function() {
      var el = epScrollRef.current;
      var fadeL = epFadeLeftRef.current;
      if (el && fadeL) fadeL.style.opacity = el.scrollLeft > 0 ? '1' : '0';
    },
    style: { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: 4, paddingRight: 40 }
  }, /*#__PURE__*/React.createElement("span", {
    style: { fontFamily: WT2.mono, fontSize: winW >= 1200 ? 11 : 10, color: WT2.faint, letterSpacing: 1.5, marginRight: 2 }
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
        fontFamily: WT2.mono,
        fontSize: winW >= 1200 ? 11 : 9.5,
        letterSpacing: winW >= 1200 ? 1.5 : 1,
        padding: winW >= 1200 ? '5px 13px' : '3px 9px',
        cursor: 'pointer', borderRadius: 0,
        transition: 'all .12s'
      }
    }, isAll ? 'ALL' : 'EP ' + String(ep).padStart(2, '0'));
  })), /*#__PURE__*/React.createElement("div", { className: 'wt-ep-fade-hint-left', ref: epFadeLeftRef }), /*#__PURE__*/React.createElement("div", { className: 'wt-ep-fade-hint' })), /*#__PURE__*/React.createElement("div", {
    className: 'wt-signal-label-row',
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
    className: 'wt-scene-grid',
    onTouchStart: function(e) { touchXRef.current = e.touches[0].clientX; },
    onTouchEnd: function(e) {
      if (touchXRef.current === null) return;
      var dx = e.changedTouches[0].clientX - touchXRef.current;
      touchXRef.current = null;
      if (Math.abs(dx) < 50) return;
      if (dx < 0 && page < totalPages - 1) goPage(page + 1);
      else if (dx > 0 && page > 0) goPage(page - 1);
    }
  }, visible.map(s => /*#__PURE__*/React.createElement(SceneCard, {
    key: s.id,
    name: s.name,
    tag: s.tag,
    desc: s.desc,
    img: s.img,
    selected: selected === s.id,
    onSelect: function() {
      if (selected === s.id) {
        setSelected(null);
        var el = document.getElementById('wt-signal');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        setSelected(s.id);
      }
    }
  }))), /*#__PURE__*/React.createElement(TermPageBar, {
    page: page,
    total: totalPages,
    onGoTo: goPage
  }), sel ? /*#__PURE__*/React.createElement("div", { ref: playerRef }, /*#__PURE__*/React.createElement(SignalFeed, {
    scene: sel,
    onClose: function() {
      setSelected(null);
      var el = document.getElementById('wt-signal');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    onPrev: selIdx > 0 ? function() { navScene(filtered[selIdx - 1]); } : null,
    onNext: selIdx < filtered.length - 1 ? function() { navScene(filtered[selIdx + 1]); } : null
  })) : null);
}
function Features() {
  const winW = useWinW();
  const narrow = winW < 900;
  return /*#__PURE__*/React.createElement("section", {
    id: "wt-signal",
    style: {
      padding: 'clamp(52px, calc(-38px + 10vw), 72px) clamp(24px, calc(-120px + 16vw), 56px)',
      borderBottom: `1px solid ${WT2.line}`,
      position: 'relative',
      overflow: 'hidden'
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
function MobileNav() {
  var _nav = ['HOME', 'ARCHIVE', 'SCENES', 'SUBMIT', 'ABOUT'];
  var _state = React.useState(0);
  var active = _state[0];
  var setActive = _state[1];

  React.useEffect(function() {
    function onScroll() {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        setActive(RAIL_SECTIONS.length - 1);
        return;
      }
      var vpCenter = window.scrollY + window.innerHeight / 2;
      var best = 0;
      var bestDist = Infinity;
      RAIL_SECTIONS.forEach(function(id, i) {
        var el = document.getElementById(id);
        if (!el) return;
        var elCenter = el.offsetTop + el.offsetHeight / 2;
        var dist = Math.abs(elCenter - vpCenter);
        if (dist < bestDist) { bestDist = dist; best = i; }
      });
      setActive(best);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return function() { window.removeEventListener('scroll', onScroll); };
  }, []);

  function navScrollTo(i) {
    setActive(i);
    var el = document.getElementById(RAIL_SECTIONS[i]);
    if (!el) return;
    // Use absolute offsetTop rather than scrollIntoView — avoids iOS Safari
    // address-bar viewport-height shifts that cause scrollIntoView to land low.
    window.scrollTo({ top: el.offsetTop, behavior: 'smooth' });
  }

  return React.createElement('nav', {
    className: 'wt-mobile-nav',
    style: {
      position: 'fixed',
      bottom: 34,
      left: 0, right: 0,
      zIndex: 199,
      background: 'rgba(7,8,9,0.96)',
      borderTop: '1px solid ' + WT2.line,
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      height: 48,
    }
  }, _nav.map(function(label, i) {
    var isActive = i === active;
    return React.createElement('button', {
      key: label,
      onClick: function() { navScrollTo(i); },
      style: {
        flex: 1,
        background: 'none',
        border: 'none',
        boxShadow: isActive ? 'inset 0 2px 0 var(--wt-accent)' : 'none',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        padding: '6px 0',
        WebkitTapHighlightColor: 'transparent',
        transition: 'box-shadow .15s',
      }
    },
      React.createElement('span', {
        style: {
          width: 6, height: 6, borderRadius: 3.5,
          background: isActive ? 'var(--wt-accent)' : WT2.faint,
          boxShadow: isActive ? '0 0 8px var(--wt-accent)' : 'none',
          transition: 'background .15s, box-shadow .15s',
          flexShrink: 0,
        }
      }),
      React.createElement('span', {
        style: {
          fontFamily: WT2.mono,
          fontSize: 9,
          letterSpacing: 2,
          color: isActive ? 'var(--wt-accent)' : WT2.dim,
          textTransform: 'uppercase',
          textShadow: isActive ? '0 0 8px var(--wt-accent)' : 'none',
          transition: 'color .15s, text-shadow .15s',
        }
      }, label)
    );
  }));
}

Object.assign(window, {
  useWinW,
  Rail,
  MobileNav,
  Hero,
  Features,
  SeekBar,
  RAIL_W,
  RAIL_W_NARROW
});