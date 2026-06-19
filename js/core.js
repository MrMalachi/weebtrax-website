function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// core.jsx — WeebTrax ARCHIVE.SYS hi-fi comp · design tokens + atoms.
// Exports to window. Loaded before sections.jsx and app.jsx.

const WT2 = {
  // surfaces — faded near-black, cool-neutral with the faintest blue
  void: '#0a0b0e',
  bg: '#0e0f13',
  panel: '#13151b',
  panel2: '#181b22',
  sink: '#070809',
  line: 'rgba(214,209,198,0.20)',
  line2: 'rgba(214,209,198,0.38)',
  lineHot: 'rgba(214,209,198,0.62)',
  fill: 'rgba(214,209,198,0.05)',
  fill2: 'rgba(214,209,198,0.09)',
  // ink — pale cream / ash
  ink: '#e6e1d4',
  body: 'rgba(230,225,212,0.86)',
  dim: 'rgba(230,225,212,0.64)',
  faint: 'rgba(230,225,212,0.44)',
  // washed accents (muted, shared low chroma)
  green: '#8fbf9f',
  greenHot: '#a7d9b4',
  purple: '#a895bd',
  blue: '#8a9cc0',
  red: '#c08a82',
  cream: '#e6e1d4',
  amber: '#c9b48a',
  mono: "'IBM Plex Mono', ui-monospace, monospace",
  term: "'VT323', 'IBM Plex Mono', monospace",
  sans: "'IBM Plex Sans', system-ui, sans-serif",
  serif: "var(--wt-wordmark, 'Zen Old Mincho'), serif",
  // distressed display face for section titles / logo / decorative headers.
  // real fonts (uploaded to comp/fonts/) win; Special Elite is the visible fallback.
  display: "'Love Letter TW', var(--wt-headfont, 'Special Elite'), 'IBM Plex Mono', monospace"
};

// ---- glitchy mincho wordmark ----------------------------------------------
function Wordmark({
  size = 96,
  color,
  style = {},
  glitch = true,
  as = 'span'
}) {
  const Tag = as;
  return /*#__PURE__*/React.createElement(Tag, {
    className: glitch ? 'wt-glitch' : '',
    "data-text": "WeebTrax",
    style: {
      fontFamily: WT2.display,
      fontWeight: 900,
      fontSize: size,
      lineHeight: 0.9,
      letterSpacing: '0',
      color: color || WT2.ink,
      position: 'relative',
      display: 'inline-block',
      textShadow: '0 0 22px rgba(143,191,159,0.14)',
      ...style
    }
  }, "WeebTrax");
}

// resolve a CSS custom-property color string to a real value for canvas use
function wtResolve(c) {
  if (typeof c === 'string' && c.indexOf('var(') === 0) {
    const name = c.slice(4, -1).split(',')[0].trim();
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || '#8fbf9f';
  }
  return c;
}

// ---- retro CRT oscilloscope waveform (low-res, scanlined, animated) --------
function Oscilloscope({
  height = 96,
  color = WT2.green,
  lines = true,
  dense = 1,
  style = {},
  playing = true,
  seeking = false
}) {
  const ref = React.useRef(null);
  const wrap = React.useRef(null);
  const playingRef = React.useRef(playing);
  const seekingRef = React.useRef(seeking);
  React.useEffect(() => {
    playingRef.current = playing;
  }, [playing]);
  React.useEffect(() => {
    seekingRef.current = seeking;
  }, [seeking]);
  React.useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const W = 240,
      H = 56;
    cv.width = W;
    cv.height = H; // low internal res -> pixelated upscale
    let raf,
      t = 0,
      mounted = true;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function draw() {
      if (!mounted) return;
      const isPlaying = playingRef.current;
      const isSeeking = seekingRef.current;
      ctx.clearRect(0, 0, W, H);
      // faint trail of previous frame for phosphor persistence
      ctx.fillStyle = 'rgba(7,8,9,0.55)';
      ctx.fillRect(0, 0, W, H);
      // baseline grid
      ctx.strokeStyle = 'rgba(143,191,159,0.10)';
      ctx.lineWidth = 1;
      for (let gx = 0; gx < W; gx += 16) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, H);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(0, H / 2);
      ctx.lineTo(W, H / 2);
      ctx.stroke();
      // waveform — smooth animated sine wave, always flowing regardless of audio
      ctx.beginPath();
      for (let x = 0; x <= W; x++) {
        const p = x / W;
        let y;
        if (isSeeking) {
          y = H / 2 + (Math.random() - 0.5) * 0.5;
        } else if (isPlaying) {
          const env = Math.sin(p * Math.PI);
          y = H / 2 + env * (Math.sin(p * 18 * dense + t * 2.1) * 9 + Math.sin(p * 7 * dense - t * 1.3) * 6 + (Math.random() - 0.5) * 3.2);
        } else {
          y = H / 2 + (Math.random() - 0.5) * 0.8;
        }
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = wtResolve(color);
      ctx.lineWidth = 2.0;
      ctx.shadowColor = wtResolve(color);
      ctx.shadowBlur = isPlaying ? 9 : 3;
      ctx.stroke();
      ctx.shadowBlur = 0;
      if (isPlaying && !reduce) t += 0.045;
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => {
      mounted = false;
      cancelAnimationFrame(raf);
    };
  }, [color, dense]);
  return /*#__PURE__*/React.createElement("div", {
    ref: wrap,
    style: {
      position: 'relative',
      height,
      overflow: 'hidden',
      background: WT2.sink,
      border: `1px solid ${WT2.line}`,
      ...style
    }
  }, /*#__PURE__*/React.createElement("canvas", {
    ref: ref,
    style: {
      width: '100%',
      height: '100%',
      display: 'block',
      imageRendering: 'pixelated',
      opacity: 0.95
    }
  }), lines && /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.34) 0 1px, transparent 1px 3px)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      background: 'radial-gradient(100% 120% at 50% 50%, transparent 60%, rgba(0,0,0,0.4) 100%)'
    }
  }));
}

// ---- blinking terminal cursor ---------------------------------------------
function Cursor({
  color = WT2.green,
  w = 10,
  h = 18
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: "wt-cursor",
    style: {
      display: 'inline-block',
      width: w,
      height: h,
      background: color,
      verticalAlign: 'text-bottom',
      marginLeft: 4,
      boxShadow: `0 0 8px ${color}`
    }
  });
}

// ---- buttons ---------------------------------------------------------------
function Btn({
  children,
  kind = 'ghost',
  accent,
  style = {},
  sm,
  ...rest
}) {
  const a = accent || 'var(--wt-accent)';
  const primary = kind === 'primary';
  return /*#__PURE__*/React.createElement("button", _extends({
    className: primary ? 'wt-btn wt-btn-primary' : 'wt-btn wt-btn-ghost',
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 9,
      fontFamily: WT2.mono,
      fontSize: sm ? 11 : 12.5,
      fontWeight: 500,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      padding: sm ? '8px 13px' : '13px 20px',
      whiteSpace: 'nowrap',
      cursor: 'pointer',
      borderRadius: 0,
      color: primary ? WT2.void : a,
      background: primary ? a : 'transparent',
      border: `1px solid ${a}`,
      transition: 'all .18s ease',
      ...style
    }
  }, rest), children);
}

// ---- mono tag / pill -------------------------------------------------------
function Tag({
  children,
  color = WT2.dim,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: WT2.mono,
      fontSize: 10,
      fontWeight: 500,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      color,
      border: `1px solid ${WT2.line}`,
      padding: '3px 8px',
      whiteSpace: 'nowrap',
      display: 'inline-block',
      ...style
    }
  }, children);
}

// ---- corner frame ticks ----------------------------------------------------
function FrameTicks({
  inset = 16,
  len = 22,
  color = WT2.line2,
  z = 5
}) {
  const c = pos => ({
    position: 'absolute',
    width: len,
    height: len,
    borderColor: color,
    borderStyle: 'solid',
    zIndex: z,
    pointerEvents: 'none',
    ...pos
  });
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: c({
      top: inset,
      left: inset,
      borderWidth: '1px 0 0 1px'
    })
  }), /*#__PURE__*/React.createElement("div", {
    style: c({
      top: inset,
      right: inset,
      borderWidth: '1px 1px 0 0'
    })
  }), /*#__PURE__*/React.createElement("div", {
    style: c({
      bottom: inset,
      left: inset,
      borderWidth: '0 0 1px 1px'
    })
  }), /*#__PURE__*/React.createElement("div", {
    style: c({
      bottom: inset,
      right: inset,
      borderWidth: '0 1px 1px 0'
    })
  }));
}

// ---- section eyebrow + title ----------------------------------------------
function SecHead({
  idx,
  kicker,
  title,
  sub,
  accent,
  style = {}
}) {
  const a = accent || 'var(--wt-accent)';
  return /*#__PURE__*/React.createElement("div", {
    style: style
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
      color: a,
      letterSpacing: 1
    }
  }, "\u258C"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: WT2.mono,
      fontSize: 10.5,
      color: a,
      letterSpacing: 2.5,
      textTransform: 'uppercase'
    }
  }, "MODULE .", idx), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: WT2.mono,
      fontSize: 10.5,
      color: WT2.faint,
      letterSpacing: 2.5,
      textTransform: 'uppercase'
    }
  }, "// ", kicker)), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontFamily: WT2.display,
      fontWeight: 800,
      fontSize: 40,
      lineHeight: 1.06,
      letterSpacing: '0.005em',
      color: WT2.ink
    }
  }, title), sub && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '14px 0 0',
      fontFamily: WT2.mono,
      fontSize: 12.5,
      color: WT2.dim,
      letterSpacing: 0.3
    }
  }, sub));
}

// ---- transmission ticker ---------------------------------------------------
function Ticker({
  items,
  color,
  style = {}
}) {
  const a = color || 'var(--wt-accent)';
  const sepStyle = {
    padding: '0 28px'
  };
  function Seg() {
    return /*#__PURE__*/React.createElement(React.Fragment, null, items.map((item, i) => /*#__PURE__*/React.createElement(React.Fragment, {
      key: i
    }, /*#__PURE__*/React.createElement("span", null, item), /*#__PURE__*/React.createElement("span", {
      "aria-hidden": true,
      style: sepStyle
    }, "\xB7"))));
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      overflow: 'hidden',
      borderTop: `1px solid ${WT2.line}`,
      borderBottom: `1px solid ${WT2.line}`,
      background: WT2.sink,
      isolation: 'isolate',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "wt-track",
    style: {
      fontFamily: WT2.mono,
      fontSize: 11,
      letterSpacing: 2,
      color: a,
      textTransform: 'uppercase',
      padding: '9px 0'
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": true,
    style: {
      display: 'inline-flex',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Seg, null)), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Seg, null))));
}

// ---- pink/magenta granule sparkle particle system -------------------------
function WiredParticles() {
  const canvasRef = React.useRef(null);
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const rng = seed => {
      let x = Math.sin(seed + 1) * 43758.5453;
      return x - Math.floor(x);
    };
    const SPACING = 16; // grid cell size in px — matches halftone dot pitch in reference
    let dots = [];
    function buildGrid(w, h) {
      dots = [];
      const cols = Math.ceil(w / SPACING) + 1;
      const rows = Math.ceil(h / SPACING) + 1;
      let k = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          // slight sub-cell jitter so grid doesn't look too mechanical
          const jx = (rng(k * 3.1 + 0.5) - 0.5) * 4;
          const jy = (rng(k * 7.3 + 1.2) - 0.5) * 4;
          dots.push({
            cx: c * SPACING + jx,
            cy: r * SPACING + jy,
            radius: 0.9 + rng(k * 2.7) * 0.8,
            // 0.9–1.7px — small tight dot
            baseOpacity: 0.09 + rng(k * 5.1) * 0.17,
            // 0.09–0.26 — very subtle
            phase: rng(k * 4.3) * Math.PI * 2,
            speed: 0.06 + rng(k * 6.7) * 0.18,
            // slow drift
            warm: rng(k * 8.9) > 0.45
          });
          k++;
        }
      }
    }
    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      buildGrid(canvas.width, canvas.height);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(document.documentElement);
    if (reduce) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dots.forEach(p => {
        const [r, g, b] = p.warm ? [210, 118, 138] : [188, 100, 122];
        ctx.beginPath();
        ctx.fillStyle = `rgba(${r},${g},${b},${p.baseOpacity})`;
        ctx.arc(p.cx, p.cy, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      return () => ro.disconnect();
    }
    let raf,
      t = 0,
      mounted = true;
    function draw() {
      if (!mounted) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dots.forEach(p => {
        const blink = 0.5 + 0.5 * Math.sin(t * p.speed + p.phase);
        const opacity = p.baseOpacity * (0.35 + 0.65 * blink);
        const [r, g, b] = p.warm ? [210, 118, 138] : [188, 100, 122];
        ctx.beginPath();
        ctx.fillStyle = `rgba(${r},${g},${b},${opacity.toFixed(3)})`;
        ctx.arc(p.cx, p.cy, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      t += 0.004; // slow, calming drift
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => {
      mounted = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);
  return /*#__PURE__*/React.createElement("canvas", {
    ref: canvasRef,
    "aria-hidden": true,
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 2,
      pointerEvents: 'none',
      width: '100%',
      height: '100%'
    }
  });
}

// ---- global texture overlays (fixed, full-viewport) -----------------------
function Overlays() {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "wt-scan",
    "aria-hidden": true,
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 9000,
      pointerEvents: 'none',
      backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0 1px, transparent 1px 3px)',
      mixBlendMode: 'multiply'
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "wt-flicker",
    "aria-hidden": true,
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 9001,
      pointerEvents: 'none',
      background: 'rgba(143,191,159,0.012)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "wt-grain",
    "aria-hidden": true,
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 9002,
      pointerEvents: 'none',
      opacity: 0.5,
      mixBlendMode: 'overlay',
      backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")"
    }
  }), /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 9003,
      pointerEvents: 'none',
      background: 'radial-gradient(130% 90% at 50% 35%, transparent 62%, rgba(0,0,0,0.4) 100%)'
    }
  }));
}
Object.assign(window, {
  WT2,
  Overlays,
  Wordmark,
  WiredParticles,
  Oscilloscope,
  Cursor,
  Btn,
  Tag,
  FrameTicks,
  SecHead,
  Ticker
});