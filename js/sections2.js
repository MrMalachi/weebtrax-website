// sections2.jsx — Transmissions, Submissions, CTA, Footer. Exports to window.

// typewriter that starts when scrolled into view
function useTypewriter(text, speed = 55, start = true) {
  const [out, setOut] = React.useState('');
  React.useEffect(() => {
    if (!start) {
      setOut('');
      return;
    }
    let i = 0,
      id;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setOut(text);
      return;
    }
    id = setInterval(() => {
      i++;
      setOut(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed, start]);
  return out;
}
function useInView(once = true) {
  const ref = React.useRef(null);
  const [seen, setSeen] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setSeen(true);
        if (once) io.disconnect();
      }
    }, {
      threshold: 0.3
    });
    io.observe(el);
    return () => io.disconnect();
  }, [once]);
  return [ref, seen];
}

// fires true on entry, false only when the element is fully out of view (threshold: 0)
// — used so a typing animation replays only after the section is 100% gone
function useReplayOnHidden() {
  const ref = React.useRef(null);
  const [seen, setSeen] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      setSeen(e.isIntersecting);
    }, {
      threshold: 0
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, seen];
}
const MOOD_TONE = { chill: WT2.blue, nostalgic: WT2.purple, dirty: WT2.red, deep: WT2.green };
// Shared terminal-style pagination bar used by Archive and Scenes sections.
// Shows prev/next + a windowed list of page numbers (current ±2, always includes first/last).
// TODO: Replace with server-side cursor pagination once PostgreSQL + FastAPI are connected (Phase 4/5).
function TermPageBar({ page, total, onGoTo }) {
  const [hov, setHov] = React.useState(null);
  const winW = useWinW();
  if (total <= 1) return null;
  const isFirst = page === 0;
  const isLast = page >= total - 1;
  const wide = winW >= 900;
  const navBtn = {
    background: 'none',
    fontFamily: WT2.mono,
    fontSize: wide ? 12 : 10,
    letterSpacing: 1.5,
    padding: wide ? '9px 18px' : '6px 12px',
    textTransform: 'uppercase',
    transition: 'all .12s',
    borderRadius: 0,
    whiteSpace: 'nowrap'
  };
  // Build windowed set: always include first, last, and current ±2
  const WIN = 2;
  const seen = new Set([0, total - 1]);
  for (let i = Math.max(0, page - WIN); i <= Math.min(total - 1, page + WIN); i++) seen.add(i);
  const nums = [...seen].sort((a, b) => a - b);
  // Insert 'gap' markers between non-consecutive pages
  const items = [];
  for (let k = 0; k < nums.length; k++) {
    if (k > 0 && nums[k] - nums[k - 1] > 1) items.push('gap' + k);
    items.push(nums[k]);
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: wide ? 7 : 5,
      marginTop: wide ? 36 : 28,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: isFirst ? undefined : () => onGoTo(page - 1),
    onMouseEnter: () => setHov('prev'),
    onMouseLeave: () => setHov(null),
    style: {
      ...navBtn,
      border: '1px solid ' + (isFirst ? WT2.line : 'var(--wt-accent)'),
      color: isFirst ? WT2.faint : hov === 'prev' ? WT2.void : 'var(--wt-accent)',
      background: !isFirst && hov === 'prev' ? 'var(--wt-accent)' : 'none',
      textShadow: !isFirst && hov !== 'prev' ? '0 0 8px var(--wt-accent)' : 'none',
      opacity: isFirst ? 0.3 : 1,
      cursor: isFirst ? 'default' : 'pointer',
      marginRight: wide ? 10 : 6
    }
  }, "← PREV"), items.map(function(item) {
    if (typeof item === 'string') {
      return /*#__PURE__*/React.createElement("span", {
        key: item,
        style: { fontFamily: WT2.mono, fontSize: wide ? 10 : 9, color: WT2.faint, padding: '0 2px', userSelect: 'none' }
      }, "···");
    }
    const isCur = item === page;
    const isH = hov === item;
    return /*#__PURE__*/React.createElement("button", {
      key: item,
      onClick: isCur ? undefined : () => onGoTo(item),
      onMouseEnter: () => setHov(item),
      onMouseLeave: () => setHov(null),
      style: {
        background: isCur ? 'var(--wt-accent)' : isH ? 'rgba(143,191,159,0.09)' : 'none',
        border: '1px solid ' + (isCur ? 'var(--wt-accent)' : isH ? 'var(--wt-accent)' : WT2.line),
        fontFamily: WT2.mono,
        fontSize: wide ? 12 : 10,
        letterSpacing: 0.5,
        padding: wide ? '7px 11px' : '5px 8px',
        minWidth: wide ? 38 : 30,
        textAlign: 'center',
        color: isCur ? WT2.void : isH ? 'var(--wt-accent)' : WT2.dim,
        textShadow: !isCur && isH ? '0 0 6px var(--wt-accent)' : 'none',
        cursor: isCur ? 'default' : 'pointer',
        transition: 'all .12s',
        borderRadius: 0
      }
    }, String(item + 1).padStart(2, '0'));
  }), /*#__PURE__*/React.createElement("button", {
    onClick: isLast ? undefined : () => onGoTo(page + 1),
    onMouseEnter: () => setHov('next'),
    onMouseLeave: () => setHov(null),
    style: {
      ...navBtn,
      border: '1px solid ' + (isLast ? WT2.line : 'var(--wt-accent)'),
      color: isLast ? WT2.faint : hov === 'next' ? WT2.void : 'var(--wt-accent)',
      background: !isLast && hov === 'next' ? 'var(--wt-accent)' : 'none',
      textShadow: !isLast && hov !== 'next' ? '0 0 8px var(--wt-accent)' : 'none',
      opacity: isLast ? 0.3 : 1,
      cursor: isLast ? 'default' : 'pointer',
      marginLeft: wide ? 10 : 6
    }
  }, "NEXT →"));
}
function getMixes() {
  return (window.__WT_MIXES || []).map(function(m) {
    return {
      id: m.id,
      title: m.title,
      file: m.slug,
      audioSrc: '/' + m.audioPath,
      youtubeUrl: m.youtubeUrl,
      soundcloudUrl: m.soundcloudUrl || null,
      desc: '',
      run: m.duration,
      date: m.releaseDate,
      plat: m.soundcloudUrl ? 'SOUNDCLOUD' : 'YOUTUBE',
      mood: m.mood,
      tone: MOOD_TONE[m.mood] || WT2.amber,
      popularity: m.views,
      tracklist: m.tracklist || [],
    };
  });
}
const SORT_MODES = ['NEWEST', 'OLDEST', 'A-Z'];
const MOODS = ['chill', 'nostalgic', 'dirty', 'deep'];
function fmtTime(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor(secs % 3600 / 60);
  const s = secs % 60;
  return [h, m, s].map(n => String(n).padStart(2, '0')).join(':');
}
function VolBar({
  vol = 0.8,
  onVolChange,
  tone,
  interactive,
  size = 'sm'
}) {
  const segs = 5;
  const [hovX, setHovX] = React.useState(null);
  const dragging = React.useRef(false);
  const savedVol = React.useRef(vol > 0 ? vol : 0.8);
  const H = size === 'lg' ? [7, 9, 12, 15, 18] : [5, 7, 9, 11, 13];
  const barW = size === 'lg' ? 54 : 38;
  React.useEffect(() => {
    if (vol > 0) savedVol.current = vol;
  }, [vol]);
  const muted = vol <= 0;
  const filledCount = muted ? 0 : Math.max(1, Math.ceil(vol * segs));
  const hovCount = hovX !== null ? Math.max(1, Math.ceil(hovX * segs)) : null;
  const display = interactive && hovCount !== null ? hovCount : filledCount;
  function setVolFromEvent(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = Math.max(0.04, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (onVolChange) onVolChange(frac);
  }
  function toggleMute(e) {
    e.stopPropagation();
    if (!onVolChange) return;
    if (muted) onVolChange(savedVol.current);else {
      savedVol.current = vol;
      onVolChange(0);
    }
  }
  return /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: interactive ? size === 'lg' ? 7 : 5 : 3
    }
  }, interactive && /*#__PURE__*/React.createElement("span", {
    onClick: toggleMute,
    title: muted ? 'Unmute' : 'Mute',
    style: {
      fontFamily: WT2.mono,
      fontSize: size === 'lg' ? 11 : 9,
      color: muted ? WT2.faint : tone,
      opacity: muted ? 0.4 : 0.72,
      cursor: 'pointer',
      userSelect: 'none',
      letterSpacing: 0.5,
      minWidth: size === 'lg' ? 34 : 26,
      textAlign: 'right',
      transition: 'color .15s, opacity .15s'
    }
  }, muted ? '—%' : `${Math.round(vol * 100)}%`), /*#__PURE__*/React.createElement("div", {
    onPointerDown: e => {
      if (!interactive || !onVolChange) return;
      e.stopPropagation();
      dragging.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      setVolFromEvent(e);
    },
    onPointerMove: e => {
      if (!interactive) return;
      const rect = e.currentTarget.getBoundingClientRect();
      setHovX(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
      if (dragging.current) setVolFromEvent(e);
    },
    onPointerUp: () => {
      dragging.current = false;
    },
    onPointerLeave: () => {
      dragging.current = false;
      setHovX(null);
    },
    title: !interactive ? `Vol ${Math.round(vol * 100)}%` : undefined,
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: size === 'lg' ? 3.5 : 2.5,
      height: H[segs - 1] + 3,
      width: barW,
      cursor: interactive ? 'ew-resize' : 'default',
      touchAction: 'none',
      userSelect: 'none'
    }
  }, Array.from({
    length: segs
  }).map((_, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      flex: 1,
      height: H[i],
      background: i < display ? tone : WT2.line2,
      opacity: i < display ? i < filledCount ? 0.88 : 0.48 : 0.18,
      transition: 'opacity 0.06s',
      borderRadius: 1
    }
  }))));
}
// Vertical VU-style volume meter — sits beside the oscilloscope in the active player.
function VolBarV({ vol = 0.8, onVolChange, tone, interactive, oscHeight = 110 }) {
  const segs = 5;
  const gap = 2;
  const labelH = 22;
  const segH = Math.max(6, Math.floor((oscHeight - labelH - gap * (segs - 1)) / segs));
  const segW = 14;
  const dragging = React.useRef(false);
  const savedVol = React.useRef(vol > 0 ? vol : 0.8);
  React.useEffect(() => { if (vol > 0) savedVol.current = vol; }, [vol]);
  const muted = vol <= 0;
  const filled = muted ? 0 : Math.max(1, Math.ceil(vol * segs));
  function setVolFromEvent(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = 1 - Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    if (onVolChange) onVolChange(Math.max(0.04, frac));
  }
  return /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flexShrink: 0, width: segW }
  }, /*#__PURE__*/React.createElement("span", {
    style: { fontFamily: WT2.mono, fontSize: 7, color: WT2.faint, letterSpacing: 1, opacity: 0.6, userSelect: 'none', textAlign: 'center' }
  }, "OUT"), /*#__PURE__*/React.createElement("div", {
    onPointerDown: e => {
      if (!interactive || !onVolChange) return;
      e.stopPropagation();
      dragging.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      setVolFromEvent(e);
    },
    onPointerMove: e => {
      if (!interactive || !dragging.current) return;
      setVolFromEvent(e);
    },
    onPointerUp: () => { dragging.current = false; },
    onPointerCancel: () => { dragging.current = false; },
    style: {
      display: 'flex', flexDirection: 'column-reverse', gap,
      cursor: interactive ? 'ns-resize' : 'default',
      touchAction: 'none', userSelect: 'none'
    }
  }, Array.from({ length: segs }).map((_, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      width: segW, height: segH,
      background: i < filled ? tone : WT2.line2,
      opacity: i < filled ? 0.9 : 0.18,
      transition: 'opacity 0.06s', borderRadius: 1
    }
  }))), /*#__PURE__*/React.createElement("span", {
    onClick: e => {
      e.stopPropagation();
      if (!onVolChange) return;
      if (muted) onVolChange(savedVol.current); else { savedVol.current = vol; onVolChange(0); }
    },
    title: muted ? 'Unmute' : 'Mute',
    style: { fontFamily: WT2.mono, fontSize: 7, color: muted ? WT2.faint : tone, opacity: 0.7, cursor: interactive ? 'pointer' : 'default', userSelect: 'none' }
  }, muted ? '0%' : Math.round(vol * 100) + '%'));
}
function ActiveRow({
  t,
  playing,
  onPlayToggle,
  elapsed,
  narrow,
  progress,
  onSeek,
  seeking,
  onSeekStateChange,
  vol,
  onVolChange
}) {
  const [hovLink, setHovLink] = React.useState(null);
  const [tracklistOpen, setTracklistOpen] = React.useState(false);
  const extLink = {
    fontFamily: WT2.mono,
    fontSize: 10.5,
    color: WT2.faint,
    letterSpacing: 1,
    textDecoration: 'none',
    transition: 'color .15s, text-shadow .15s'
  };
  const extLinkHov = {
    ...extLink,
    color: 'var(--wt-accent)',
    textShadow: '0 0 8px var(--wt-accent)'
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      border: `1px solid ${WT2.line2}`,
      background: WT2.panel,
      padding: narrow ? 18 : 24,
      position: 'relative',
      display: narrow ? 'flex' : 'grid',
      flexDirection: narrow ? 'column' : undefined,
      gridTemplateColumns: narrow ? undefined : '280px 1fr',
      gap: narrow ? 16 : 28,
      minWidth: 0,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
      background: 'var(--wt-accent)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 5
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'stretch',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Oscilloscope, {
    height: narrow ? 72 : 110,
    color: "var(--wt-accent)",
    dense: 1.1,
    playing: playing,
    seeking: seeking,
    style: { flex: 1, minWidth: 0 }
  }), /*#__PURE__*/React.createElement(VolBarV, {
    vol: vol,
    onVolChange: onVolChange,
    tone: "var(--wt-accent)",
    interactive: true,
    oscHeight: narrow ? 72 : 110
  })), /*#__PURE__*/React.createElement(SeekBar, {
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
      marginTop: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: WT2.mono,
      fontSize: 10,
      color: WT2.dim
    }
  }, fmtTime(elapsed)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: WT2.mono,
      fontSize: 10,
      color: WT2.faint
    }
  }, t.run))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 10,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Tag, {
    color: "var(--wt-accent)"
  }, playing ? '◉ NOW DECODING' : '◎ STANDBY'), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: WT2.mono,
      fontSize: 11,
      color: WT2.faint
    }
  }, "TX-", t.id, " \xB7 ", t.file, " \xB7 ", t.date)), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: '0 0 8px',
      fontFamily: WT2.display,
      fontWeight: 800,
      fontSize: 26,
      color: WT2.ink
    }
  }, t.title), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      marginTop: 14,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    kind: "primary",
    sm: true,
    onClick: onPlayToggle
  }, playing ? '▐▐ Pause' : '▸ Listen'), t.youtubeUrl && t.youtubeUrl !== '#' && /*#__PURE__*/React.createElement("a", {
    href: t.youtubeUrl,
    target: "_blank",
    rel: "noopener noreferrer",
    onMouseEnter: () => setHovLink('yt'),
    onMouseLeave: () => setHovLink(null),
    style: hovLink === 'yt' ? extLinkHov : extLink
  }, "YOUTUBE \u2197"), t.soundcloudUrl && t.soundcloudUrl !== '#' && /*#__PURE__*/React.createElement("a", {
    href: t.soundcloudUrl,
    target: "_blank",
    rel: "noopener noreferrer",
    onMouseEnter: () => setHovLink('sc'),
    onMouseLeave: () => setHovLink(null),
    style: hovLink === 'sc' ? extLinkHov : extLink
  }, "SOUNDCLOUD \u2197"),
    t.tracklist && t.tracklist.length > 0 && React.createElement("button", {
      onClick: function() { setTracklistOpen(function(o) { return !o; }); },
      style: { display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', fontFamily: WT2.mono, fontSize: 9, letterSpacing: 2, color: WT2.faint, textTransform: 'uppercase', flexShrink: 0 }
    }, 'TRACK I.D.', React.createElement('span', { style: { color: 'var(--wt-accent)', fontSize: 8, marginLeft: 2 } }, tracklistOpen ? '\u25b2' : '\u25bc'))
  ), tracklistOpen && t.tracklist && t.tracklist.length > 0 && React.createElement("div", {
    style: { marginTop: 10, borderTop: '1px solid ' + WT2.line, maxHeight: 160, overflowY: 'auto', paddingBottom: 4 }
  }, t.tracklist.map(function(entry, i) {
    var isCur = elapsed >= entry.timeSecs && (i === t.tracklist.length - 1 || elapsed < t.tracklist[i + 1].timeSecs);
    var h = Math.floor(entry.timeSecs / 3600), m = Math.floor((entry.timeSecs % 3600) / 60), s = entry.timeSecs % 60;
    var ts = h > 0 ? h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0') : String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    return React.createElement("div", {
      key: i,
      onClick: function() {
        var parts = (t.run || '00:00:00').split(':').map(Number);
        var totalSecs = parts[0] * 3600 + parts[1] * 60 + parts[2];
        if (totalSecs > 0 && onSeek) onSeek((entry.timeSecs + 1) / totalSecs);
      },
      style: { display: 'flex', gap: 8, padding: '2px 6px', marginBottom: 1, cursor: 'pointer', borderLeft: isCur ? '2px solid var(--wt-accent)' : '2px solid transparent', background: isCur ? 'rgba(143,191,159,0.05)' : 'none', transition: 'border-color .15s, background .15s' }
    },
      React.createElement("span", { style: { flexShrink: 0, minWidth: 44, fontFamily: WT2.mono, fontSize: 11, color: WT2.faint, opacity: 0.7 } }, ts),
      React.createElement("span", { style: { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: WT2.mono, fontSize: 10, color: isCur ? 'var(--wt-accent)' : WT2.dim, fontSize: 11 } }, entry.artist ? entry.artist + ' \u2014 ' + entry.title : entry.title)
    );
  }))))
}
function Transmissions({
  playing,
  onPlayToggle,
  elapsed,
  onReset,
  activeTxId,
  onLoadTrack,
  progress,
  onSeek,
  seeking,
  onSeekStateChange,
  vol,
  onVolChange
}) {
  const ARCHIVE_PER_PAGE = 5;
  const winW = useWinW();
  const narrow = winW < 900;
  const mid = winW >= 900 && winW < 1200;
  const [hover, setHover] = React.useState(-1);
  const [sortIdx, setSortIdx] = React.useState(0);
  const [moodFilter, setMoodFilter] = React.useState(null);
  const [page, setPage] = React.useState(0);
  const [hovLink, setHovLink] = React.useState(null);
  const TX = getMixes();
  const activeTx = TX.find(t => t.id === activeTxId) || TX[0];
  const sorted = React.useMemo(() => {
    const arr = [...TX];
    const mode = SORT_MODES[sortIdx];
    if (mode === 'OLDEST') arr.sort((a, b) => a.date.localeCompare(b.date));
    else if (mode === 'A-Z') arr.sort((a, b) => a.title.localeCompare(b.title));
    else arr.sort((a, b) => b.date.localeCompare(a.date));
    return arr;
  }, [sortIdx]);
  const filtered = moodFilter ? sorted.filter(function(t) { return t.mood === moodFilter; }) : sorted;
  const totalPages = Math.max(1, Math.ceil(filtered.length / ARCHIVE_PER_PAGE));
  const pageItems = filtered.slice(page * ARCHIVE_PER_PAGE, (page + 1) * ARCHIVE_PER_PAGE);
  function cycleSort() {
    setSortIdx(i => (i + 1) % SORT_MODES.length);
    setPage(0);
    setHover(-1);
  }
  function setMood(mood) {
    setMoodFilter(function(prev) { return prev === mood ? null : mood; });
    setPage(0);
    setHover(-1);
  }
  function handleRowClick(id) {
    if (id === activeTxId) {
      onPlayToggle();
    } else {
      onLoadTrack(id);
    }
  }
  const playBtn = {
    background: 'none',
    border: `1px solid var(--wt-accent)`,
    cursor: 'pointer',
    fontFamily: WT2.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    padding: '3px 9px',
    color: 'var(--wt-accent)',
    textShadow: '0 0 6px var(--wt-accent)',
    whiteSpace: 'nowrap',
    transition: 'box-shadow .15s'
  };
  const extLink = {
    fontFamily: WT2.mono,
    fontSize: 11,
    color: WT2.faint,
    letterSpacing: 1,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    transition: 'color .15s, text-shadow .15s'
  };
  const extLinkHov = {
    ...extLink,
    color: 'var(--wt-accent)',
    textShadow: '0 0 8px var(--wt-accent)'
  };
  return /*#__PURE__*/React.createElement("section", {
    id: "wt-archive",
    style: {
      padding: narrow ? '60px 24px' : '90px 56px',
      borderBottom: `1px solid ${WT2.line}`,
      position: 'relative',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      zIndex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: { marginBottom: 16 }
  }, /*#__PURE__*/React.createElement(SecHead, {
    idx: "01",
    kicker: "ARCHIVE",
    title: "Latest Transmissions"
  }), /*#__PURE__*/React.createElement("div", {
    style: { display: 'flex', flexDirection: 'column', marginTop: 10, gap: 8 }
  }, /*#__PURE__*/React.createElement("div", {
    style: { fontFamily: WT2.mono, fontSize: 11.5, color: WT2.dim, letterSpacing: 0.5, whiteSpace: 'nowrap' }
  }, /*#__PURE__*/React.createElement("span", {
    style: { color: WT2.faint }
  }, "~/weebtrax/"), /*#__PURE__*/React.createElement("span", {
    style: { color: 'var(--wt-accent)' }
  }, "transmissions/"), " \xA0 " + String(filtered.length).padStart(3, '0') + '/' + String(TX.length).padStart(3, '0') + " files \xA0↯\xA0", /*#__PURE__*/React.createElement("span", {
    onClick: cycleSort,
    style: { cursor: 'pointer', userSelect: 'none' }
  }, "sort: ", /*#__PURE__*/React.createElement("span", {
    style: { color: 'var(--wt-accent)' }
  }, SORT_MODES[sortIdx].toLowerCase()), /*#__PURE__*/React.createElement("span", {
    style: { color: WT2.faint, marginLeft: 5 }
  }, "\u2195"))), /*#__PURE__*/React.createElement("div", {
    style: { display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }
  }, /*#__PURE__*/React.createElement("span", {
    style: { fontFamily: WT2.mono, fontSize: 10, color: WT2.faint, letterSpacing: 1.5, marginRight: 2 }
  }, "MOOD:"), ['all'].concat(MOODS).map(function(m) {
    const isAll = m === 'all';
    const active = isAll ? !moodFilter : moodFilter === m;
    const tone = isAll ? 'var(--wt-accent)' : MOOD_TONE[m];
    return /*#__PURE__*/React.createElement("button", {
      key: m,
      onClick: function() { isAll ? setMoodFilter(null) || setPage(0) : setMood(m); },
      style: {
        background: active ? tone : 'none',
        border: '1px solid ' + (active ? tone : WT2.line),
        color: active ? WT2.void : isAll ? WT2.dim : tone,
        fontFamily: WT2.mono, fontSize: 9.5, letterSpacing: 1.5,
        padding: '3px 9px', cursor: 'pointer', borderRadius: 0,
        textTransform: 'uppercase', transition: 'all .12s'
      }
    }, m);
  })))), /*#__PURE__*/React.createElement(ActiveRow, {
    t: activeTx,
    playing: playing,
    onPlayToggle: onPlayToggle,
    elapsed: elapsed,
    narrow: narrow,
    progress: progress,
    onSeek: onSeek,
    seeking: seeking,
    onSeekStateChange: onSeekStateChange,
    vol: vol,
    onVolChange: onVolChange
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      border: `1px solid ${WT2.line}`,
      overflowX: 'auto'
    }
  }, !narrow && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: mid ? '40px 1fr 60px 80px 90px 120px' : '48px 1fr 68px 100px 108px 152px',
      alignItems: 'center',
      padding: '11px 18px',
      borderBottom: `1px solid ${WT2.line}`,
      background: WT2.sink,
      fontFamily: WT2.mono,
      fontSize: 10,
      letterSpacing: 1.5,
      color: WT2.faint,
      textTransform: 'uppercase'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      textAlign: 'left'
    }
  }, "#"), /*#__PURE__*/React.createElement("span", {
    style: {
      textAlign: 'left'
    }
  }, "FILE"), /*#__PURE__*/React.createElement("span", {
    style: {
      textAlign: 'center'
    }
  }, "OUTPUT"), /*#__PURE__*/React.createElement("span", {
    style: {
      textAlign: 'center'
    }
  }, "RUNTIME"), /*#__PURE__*/React.createElement("span", {
    style: {
      textAlign: 'center'
    }
  }, "DATE"), /*#__PURE__*/React.createElement("span", {
    style: {
      textAlign: 'center'
    }
  }, "ACTION")), pageItems.map((t, i) => {
    const isActive = t.id === activeTxId;
    const isHov = hover === i;
    const rowBg = isActive ? 'rgba(143,191,159,0.055)' : isHov ? WT2.fill : 'transparent';
    return narrow ? /*#__PURE__*/React.createElement("div", {
      key: t.id,
      onClick: () => handleRowClick(t.id),
      onMouseEnter: () => setHover(i),
      onMouseLeave: () => setHover(-1),
      role: "button",
      tabIndex: 0,
      onKeyDown: e => (e.key === 'Enter' || e.key === ' ') && handleRowClick(t.id),
      "aria-label": `${isActive && playing ? 'Pause' : 'Play'} ${t.title}`,
      style: {
        padding: '14px 18px',
        borderBottom: i < filtered.length - 1 ? `1px solid ${WT2.line}` : 'none',
        background: rowBg,
        boxShadow: isActive ? 'inset 0 0 0 1px rgba(143,191,159,0.22)' : 'none',
        transition: 'background .15s',
        cursor: 'pointer'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 8,
        marginBottom: 6
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'baseline',
        gap: 8,
        minWidth: 0,
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: WT2.mono,
        fontSize: 11,
        color: isActive || isHov ? 'var(--wt-accent)' : WT2.faint,
        flexShrink: 0,
        textShadow: isActive ? '0 0 6px var(--wt-accent)' : 'none'
      }
    }, isActive && playing ? '◉' : t.id), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: WT2.display,
        fontWeight: 700,
        fontSize: 15,
        color: WT2.ink,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        minWidth: 0
      }
    }, t.title)), isActive && playing && /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: WT2.mono,
        fontSize: 9,
        color: 'var(--wt-accent)',
        letterSpacing: 1,
        textShadow: '0 0 6px var(--wt-accent)',
        whiteSpace: 'nowrap',
        flexShrink: 0
      }
    }, "NOW DECODING")), /*#__PURE__*/React.createElement("p", {
      style: {
        margin: '0 0 10px',
        fontFamily: WT2.sans,
        fontSize: 12,
        color: WT2.dim,
        lineHeight: 1.45
      }
    }, t.desc), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: e => {
        e.stopPropagation();
        handleRowClick(t.id);
      },
      style: playBtn,
      "aria-label": `${isActive && playing ? 'Pause' : 'Play'} ${t.title}`
    }, isActive && playing ? '▐▐ PAUSE' : '▶ PLAY'), t.youtubeUrl && t.youtubeUrl !== '#' && /*#__PURE__*/React.createElement("a", {
      href: t.youtubeUrl,
      target: "_blank",
      rel: "noopener noreferrer",
      onClick: e => e.stopPropagation(),
      "aria-label": `Watch ${t.title} on YouTube (opens in new tab)`,
      onMouseEnter: () => setHovLink(`${t.id}-yt`),
      onMouseLeave: () => setHovLink(null),
      style: hovLink === `${t.id}-yt` ? extLinkHov : extLink
    }, "YT \u2197"), t.soundcloudUrl && t.soundcloudUrl !== '#' && /*#__PURE__*/React.createElement("a", {
      href: t.soundcloudUrl,
      target: "_blank",
      rel: "noopener noreferrer",
      onClick: e => e.stopPropagation(),
      "aria-label": `Listen to ${t.title} on SoundCloud (opens in new tab)`,
      onMouseEnter: () => setHovLink(`${t.id}-sc`),
      onMouseLeave: () => setHovLink(null),
      style: hovLink === `${t.id}-sc` ? extLinkHov : extLink
    }, "SC \u2197"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: WT2.mono,
        fontSize: 11,
        color: WT2.dim
      }
    }, t.run), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: WT2.mono,
        fontSize: 11,
        color: WT2.faint
      }
    }, t.date))) : /*#__PURE__*/React.createElement("div", {
      key: t.id,
      onMouseEnter: () => setHover(i),
      onMouseLeave: () => setHover(-1),
      onClick: () => handleRowClick(t.id),
      role: "button",
      tabIndex: 0,
      onKeyDown: e => (e.key === 'Enter' || e.key === ' ') && handleRowClick(t.id),
      "aria-label": `${isActive && playing ? 'Pause' : 'Play'} ${t.title}`,
      style: {
        display: 'grid',
        gridTemplateColumns: mid ? '40px 1fr 60px 80px 90px 120px' : '48px 1fr 68px 100px 108px 152px',
        alignItems: 'center',
        padding: '15px 18px',
        borderBottom: i < filtered.length - 1 ? `1px solid ${WT2.line}` : 'none',
        background: rowBg,
        boxShadow: isActive ? 'inset 0 0 0 1px rgba(143,191,159,0.22)' : 'none',
        transition: 'background .15s',
        cursor: 'pointer'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: WT2.mono,
        fontSize: 12,
        color: isActive || isHov ? 'var(--wt-accent)' : WT2.faint,
        textAlign: 'left',
        textShadow: isActive ? '0 0 6px var(--wt-accent)' : 'none'
      }
    }, isActive && playing ? '◉' : t.id), /*#__PURE__*/React.createElement("span", {
      style: {
        minWidth: 0,
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: WT2.display,
        fontWeight: 700,
        fontSize: 16,
        color: WT2.ink
      }
    }, t.title), isActive && playing && /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: WT2.mono,
        fontSize: 9,
        color: 'var(--wt-accent)',
        marginLeft: 10,
        letterSpacing: 1,
        textShadow: '0 0 6px var(--wt-accent)'
      }
    }, "NOW DECODING"), /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'block',
        fontFamily: WT2.mono,
        fontSize: 10,
        color: WT2.faint,
        marginTop: 3,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }
    }, t.file)), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'center'
      }
    }, /*#__PURE__*/React.createElement(VolBar, {
      vol: vol,
      onVolChange: onVolChange,
      tone: isActive || isHov ? 'var(--wt-accent)' : WT2.line2,
      interactive: isActive
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: WT2.mono,
        fontSize: 12,
        color: WT2.dim,
        textAlign: 'center'
      }
    }, t.run), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: WT2.mono,
        fontSize: 12,
        color: WT2.dim,
        textAlign: 'center'
      }
    }, t.date), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 5
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: e => {
        e.stopPropagation();
        handleRowClick(t.id);
      },
      style: playBtn,
      "aria-label": `${isActive && playing ? 'Pause' : 'Play'} ${t.title}`
    }, isActive && playing ? '▐▐ PAUSE' : '▶ PLAY'), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 10,
        marginTop: 5
      }
    }, t.youtubeUrl && t.youtubeUrl !== '#' && /*#__PURE__*/React.createElement("a", {
      href: t.youtubeUrl,
      target: "_blank",
      rel: "noopener noreferrer",
      onClick: e => e.stopPropagation(),
      "aria-label": `Watch ${t.title} on YouTube (opens in new tab)`,
      onMouseEnter: () => setHovLink(`${t.id}-yt`),
      onMouseLeave: () => setHovLink(null),
      style: hovLink === `${t.id}-yt` ? extLinkHov : extLink
    }, "YT \u2197"), t.soundcloudUrl && t.soundcloudUrl !== '#' && /*#__PURE__*/React.createElement("a", {
      href: t.soundcloudUrl,
      target: "_blank",
      rel: "noopener noreferrer",
      onClick: e => e.stopPropagation(),
      "aria-label": `Listen to ${t.title} on SoundCloud (opens in new tab)`,
      onMouseEnter: () => setHovLink(`${t.id}-sc`),
      onMouseLeave: () => setHovLink(null),
      style: hovLink === `${t.id}-sc` ? extLinkHov : extLink
    }, "SC \u2197"))));
  })), /*#__PURE__*/React.createElement(TermPageBar, {
    page: page,
    total: totalPages,
    onGoTo: function(p) { setPage(p); setHover(-1); }
  })));
}
function UplinkMeter() {
  const [ref, seen] = [React.useRef(null), true];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: 5,
      height: 150
    }
  }, Array.from({
    length: 26
  }).map((_, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "wt-uplink-bar",
    style: {
      flex: 1,
      background: i % 5 === 0 ? 'var(--wt-accent)' : WT2.fill2,
      border: `1px solid ${WT2.line}`,
      height: `${20 + Math.abs(Math.sin(i * 0.7)) * 80}%`,
      animationDelay: `${i * 0.08}s`
    }
  })));
}
function Submissions() {
  const winW = useWinW();
  const narrow = winW < 900;
  const [ref, seen] = useReplayOnHidden();
  const typed = useTypewriter('upload --track ./your_signal.wav', 48, seen);
  const done = typed.length >= 'upload --track ./your_signal.wav'.length;
  const OUT1 = '> receiving low-fidelity club signals · deep cuts · dub echoes · ambient transmissions';
  const OUT2 = '> google form only. all submissions manually decoded.';
  const typed2 = useTypewriter(OUT1, 34, done);
  const done2 = typed2.length >= OUT1.length;
  const typed3 = useTypewriter(OUT2, 34, done2);
  const [linkState, setLinkState] = React.useState('idle'); // 'idle' | 'copied' | 'failed'

  const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSd8vnfi7fD64hfVc6HTVnUNob_e6AtCB8HPR6irs0ZmIkiduA/viewform?pli=1';
  function copyLink() {
    navigator.clipboard.writeText(FORM_URL).then(() => {
      setLinkState('copied');
      setTimeout(() => setLinkState('idle'), 1800);
    }).catch(() => {
      setLinkState('failed');
      setTimeout(() => setLinkState('idle'), 2500);
    });
  }
  const SPECS = [{
    label: 'ACCEPTED',
    value: 'lo-fi house · deep house · dub house · minimal house · ambient house'
  }, {
    label: 'BPM RANGE',
    value: '110–130 preferred'
  }, {
    label: 'SEND',
    value: 'Google Form only'
  }, {
    label: 'INCLUDE',
    value: 'email · .wav/.mp3 · artist name · comment'
  }, {
    label: 'STATUS',
    value: 'unreleased + released tracks accepted'
  }, {
    label: 'RIGHTS',
    value: 'original music only, or music you have permission to share'
  }];
  return /*#__PURE__*/React.createElement("section", {
    id: "wt-uplink",
    ref: ref,
    style: {
      padding: narrow ? '60px 24px' : '90px 56px',
      borderBottom: `1px solid ${WT2.line}`,
      position: 'relative',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      zIndex: 1
    }
  }, /*#__PURE__*/React.createElement(SecHead, {
    idx: "03",
    kicker: "SUBMIT",
    title: "Track Submissions",
    sub: "producers \u2014 transmit your signal into the wired",
    style: {
      marginBottom: 34
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: narrow ? '1fr' : '1.35fr 1fr',
      gap: 32,
      alignItems: 'stretch'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      border: `1px solid ${WT2.line2}`,
      background: WT2.sink,
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '10px 14px',
      borderBottom: `1px solid ${WT2.line}`,
      background: WT2.panel
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 9,
      height: 9,
      borderRadius: 5,
      border: `1px solid ${WT2.line2}`
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 9,
      height: 9,
      borderRadius: 5,
      border: `1px solid ${WT2.line2}`
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 9,
      height: 9,
      borderRadius: 5,
      background: 'var(--wt-accent)',
      boxShadow: '0 0 6px var(--wt-accent)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: WT2.mono,
      fontSize: 11,
      color: WT2.dim,
      marginLeft: 8,
      letterSpacing: 1,
      whiteSpace: 'nowrap'
    }
  }, "uplink.weebtrax")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '22px 22px 26px',
      fontFamily: WT2.term,
      fontSize: 16,
      lineHeight: 1.7,
      color: 'var(--wt-accent)',
      flex: 1,
      minHeight: 150
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: WT2.dim
    }
  }, "~/weebtrax/uplink $ connect wired"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: WT2.body,
      margin: '2px 0 12px'
    }
  }, "> handshake complete. channel open."), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: {
      color: WT2.dim
    }
  }, "~/weebtrax/uplink $ "), typed, /*#__PURE__*/React.createElement(Cursor, {
    color: "var(--wt-accent)"
  })), done && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      color: WT2.body,
      marginTop: 6
    }
  }, "> upload channel open."), /*#__PURE__*/React.createElement("div", {
    style: {
      color: WT2.faint,
      fontSize: 14,
      marginTop: 4
    }
  }, typed2, !done2 && /*#__PURE__*/React.createElement(Cursor, {
    color: "var(--wt-accent)"
  })), done2 && /*#__PURE__*/React.createElement("div", {
    style: {
      color: WT2.faint,
      fontSize: 14,
      marginTop: 4
    }
  }, typed3, typed3.length < OUT2.length && /*#__PURE__*/React.createElement(Cursor, {
    color: "var(--wt-accent)"
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 22px 22px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    kind: "primary",
    onClick: () => window.open(FORM_URL, '_blank', 'noopener,noreferrer')
  }, "\u25BA SUBMIT YOUR MUSIC \u2197"), /*#__PURE__*/React.createElement(Btn, {
    onClick: copyLink
  }, linkState === 'copied' ? '✓ LINK COPIED' : linkState === 'failed' ? 'COPY FAILED — TRY AGAIN' : '☉ COPY SUBMISSION LINK'))), /*#__PURE__*/React.createElement("div", {
    style: {
      border: `1px solid ${WT2.line}`,
      background: WT2.panel,
      padding: '22px 24px',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement(FrameTicks, {
    inset: 10,
    len: 16
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: WT2.mono,
      fontSize: 11,
      color: 'var(--wt-accent)',
      letterSpacing: 2
    }
  }, "TRANSMISSION SPECS"), /*#__PURE__*/React.createElement("span", {
    className: "wt-pulse",
    style: {
      width: 7,
      height: 7,
      borderRadius: 5,
      background: 'var(--wt-accent)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, SPECS.map(({
    label,
    value
  }, i) => /*#__PURE__*/React.createElement("div", {
    key: label,
    style: {
      display: 'grid',
      gridTemplateColumns: '82px 1fr',
      gap: 12,
      padding: '9px 0',
      borderBottom: i < SPECS.length - 1 ? `1px solid ${WT2.line}` : 'none'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: WT2.mono,
      fontSize: 9,
      color: WT2.faint,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      lineHeight: 1.55,
      paddingTop: 1
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: WT2.mono,
      fontSize: 11.5,
      color: WT2.body,
      lineHeight: 1.6,
      minWidth: 0
    }
  }, value)))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: WT2.mono,
      fontSize: 10,
      color: WT2.faint,
      marginTop: 18,
      letterSpacing: 1
    }
  }, "node \xB7 35.68N 139.69E")))));
}
function Cta() {
  return null; /* removed */
  return /*#__PURE__*/React.createElement("section", {
    id: "wt-wired",
    style: {
      position: 'relative',
      minHeight: 460,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderBottom: `1px solid ${WT2.line}`,
      overflow: 'hidden',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("img", {
    className: "wt-kenburns",
    src: window.WT_IMG.cta,
    alt: "",
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      objectPosition: 'center',
      display: 'block'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'radial-gradient(125% 105% at 50% 45%, rgba(10,11,14,0.32) 0%, rgba(10,11,14,0.6) 55%, rgba(10,11,14,0.82) 100%)'
    }
  }), /*#__PURE__*/React.createElement(FrameTicks, {
    inset: 22,
    len: 26
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      zIndex: 3,
      padding: '0 32px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: WT2.mono,
      fontSize: 11,
      letterSpacing: 4,
      color: 'var(--wt-accent)',
      marginBottom: 24
    }
  }, "// NETWORK GATEWAY"), /*#__PURE__*/React.createElement("h2", {
    className: "wt-glitch",
    "data-text": "Enter the WeebTrax Wired.",
    style: {
      margin: 0,
      fontFamily: WT2.display,
      fontWeight: 900,
      fontSize: 'clamp(38px, 6vw, 76px)',
      lineHeight: 1.08,
      letterSpacing: '0',
      color: WT2.ink,
      textShadow: '0 0 30px rgba(143,191,159,0.18)'
    }
  }, "Enter the WeebTrax Wired."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 16,
      justifyContent: 'center',
      marginTop: 34,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    kind: "primary"
  }, "\u25B8 Watch on YouTube"), /*#__PURE__*/React.createElement(Btn, null, "Submit Music"))));
}
function BusinessContact() {
  const [state, setState] = React.useState('idle'); // 'idle' | 'copied' | 'failed'
  const winW = useWinW();
  function handleCopy() {
    // ── UPDATE BUSINESS EMAIL HERE ──────────────────────────────────
    const emailUser = "baakagaijin";
    const emailDomain = "gmail";
    const emailTld = "com";
    // ────────────────────────────────────────────────────────────────
    const addr = `${emailUser}@${emailDomain}.${emailTld}`;
    navigator.clipboard.writeText(addr).then(() => {
      setState('copied');
      setTimeout(() => setState('idle'), 1800);
    }).catch(() => {
      setState('failed');
      setTimeout(() => setState('idle'), 2500);
    });
  }
  const [hov, setHov] = React.useState(false);
  const active = state === 'copied';
  const failed = state === 'failed';
  const label = failed ? 'BUSINESS_INQUIRIES :: ! COPY FAILED' : active ? 'BUSINESS_INQUIRIES :: ✓ COPIED' : 'BUSINESS_INQUIRIES :: ✉ COPY CONTACT';
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: WT2.mono,
      fontSize: 9,
      letterSpacing: 2,
      marginBottom: 7
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: WT2.faint
    }
  }, "/sys/"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--wt-accent)'
    }
  }, "contact")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": "Copy business inquiry contact email",
    onClick: handleCopy,
    onMouseEnter: () => setHov(true),
    onMouseLeave: () => setHov(false),
    onFocus: () => setHov(true),
    onBlur: () => setHov(false),
    style: {
      background: active ? 'rgba(143,191,159,0.08)' : hov ? 'rgba(143,191,159,0.06)' : 'none',
      border: `1px solid ${active ? WT2.green : hov ? 'rgba(143,191,159,0.75)' : 'rgba(143,191,159,0.3)'}`,
      cursor: 'pointer',
      padding: '9px 18px',
      fontFamily: WT2.mono,
      fontSize: 11,
      letterSpacing: winW < 900 ? 1.2 : 2.5,
      textTransform: 'uppercase',
      color: active ? WT2.green : failed ? WT2.red : hov ? WT2.green : WT2.dim,
      textShadow: active ? `0 0 10px ${WT2.green}` : hov ? '0 0 8px rgba(143,191,159,0.7)' : 'none',
      boxShadow: active ? `0 0 16px rgba(143,191,159,0.18), inset 0 0 12px rgba(143,191,159,0.06)` : hov ? '0 0 12px rgba(143,191,159,0.15), inset 0 0 8px rgba(143,191,159,0.04)' : 'none',
      transition: 'color .18s, border-color .18s, box-shadow .18s, text-shadow .18s, background .18s',
      outline: 'none',
      display: 'block',
      whiteSpace: winW < 600 ? 'normal' : 'nowrap'
    }
  }, label));
}
function Footer() {
  const winW = useWinW();
  const narrow = winW < 720;
  const NAV = [['HOME', 'wt-index'], ['ARCHIVE', 'wt-archive'], ['SCENES', 'wt-signal'], ['SUBMIT', 'wt-uplink'], ['ABOUT', 'wt-wired']];
  const SOCIALS = [['YOUTUBE', 'https://www.youtube.com/@WeebTrax'], ['SOUNDCLOUD', 'https://soundcloud.com/weebtrax?utm_source=clipboard&utm_medium=text&utm_campaign=social_sharing'], ['INSTAGRAM', 'https://www.instagram.com/weeb_trax'], ['TIKTOK', 'https://www.tiktok.com/@weebtrax']];
  function scrollTo(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({
      behavior: 'smooth'
    });
  }
  const colLabel = txt => /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: WT2.mono,
      fontSize: 9.5,
      color: WT2.faint,
      letterSpacing: 2.5,
      marginBottom: 10,
      borderBottom: `1px solid ${WT2.line}`,
      paddingBottom: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--wt-accent)',
      marginRight: 5,
      opacity: 0.7
    }
  }, "\u258C"), txt);
  return /*#__PURE__*/React.createElement("footer", {
    id: "wt-wired",
    style: {
      borderTop: `1px solid ${WT2.line}`,
      padding: narrow ? '12px 24px 32px' : '40px 56px 40px',
      position: 'relative',
      overflow: 'hidden'
    }
  }, !narrow && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 32,
      paddingBottom: 16,
      borderBottom: `1px solid ${WT2.line}`,
      fontFamily: WT2.mono,
      fontSize: 10,
      letterSpacing: 2,
      color: WT2.faint,
      textTransform: 'uppercase'
    }
  }, /*#__PURE__*/React.createElement("span", null, "ARCHIVE.SYS \xB7 NODE.227 \xB7 35.68N 139.69E"), /*#__PURE__*/React.createElement("span", {
    style: { color: 'var(--wt-accent)', textShadow: '0 0 8px var(--wt-accent)' }
  }, "STATUS: ONLINE")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      zIndex: 1
    }
  }, narrow ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 36
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
  }, "MODULE .04"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: WT2.mono,
      fontSize: 10.5,
      color: WT2.faint,
      letterSpacing: 2.5,
      textTransform: 'uppercase'
    }
  }, "// ABOUT")) : null, narrow ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 32
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Wordmark, {
    size: 38,
    glitch: false,
    style: {
      display: 'block'
    }
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '14px 0 20px',
      fontFamily: WT2.sans,
      fontSize: 13.5,
      color: WT2.dim,
      maxWidth: 260,
      lineHeight: 1.5
    }
  }, "Lo-Fi House sound + Anime aesthetic.", /*#__PURE__*/React.createElement("br", null), "New transmissions every Saturday.", /*#__PURE__*/React.createElement("br", null), "A future independent label from the Wired."), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: `1px solid ${WT2.line}`,
      paddingTop: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: WT2.mono,
      fontSize: 9.5,
      color: WT2.faint,
      letterSpacing: 2.5,
      marginBottom: 7
    }
  }, "// TRANSMISSION"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: WT2.mono,
      fontSize: 11,
      color: WT2.faint,
      letterSpacing: 0.5,
      lineHeight: 1.6
    }
  }, "WEEBTRAX \xB7 LOW-FIDELITY HOUSE MIXES", /*#__PURE__*/React.createElement("br", null), "FROM CYBERIA CAF\xC9 & CLUB"))), /*#__PURE__*/React.createElement("div", null, colLabel('// NAV'), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '10px 20px'
    }
  }, NAV.map(([label, id]) => /*#__PURE__*/React.createElement("a", {
    key: id,
    href: `#${id}`,
    onClick: e => {
      e.preventDefault();
      scrollTo(id);
    },
    className: "wt-flink",
    style: {
      fontFamily: WT2.mono,
      fontSize: 12.5,
      color: WT2.body,
      textDecoration: 'none',
      letterSpacing: 1.5,
      cursor: 'pointer'
    }
  }, label)))), /*#__PURE__*/React.createElement("div", null, colLabel('// SOCIAL SIGNALS'), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '10px 20px'
    }
  }, SOCIALS.map(([label, url]) => /*#__PURE__*/React.createElement("a", {
    key: label,
    href: url,
    target: "_blank",
    rel: "noopener noreferrer",
    className: "wt-flink",
    style: {
      fontFamily: WT2.mono,
      fontSize: 12.5,
      color: WT2.body,
      textDecoration: 'none',
      letterSpacing: 1.5,
      display: 'flex',
      alignItems: 'center',
      gap: 5
    }
  }, label, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--wt-accent)',
      fontSize: 10,
      lineHeight: 1
    }
  }, "\u2197")))))) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.6fr 1fr 1fr',
      gridTemplateRows: 'auto auto',
      gap: '0 40px',
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: 1,
      gridRow: 1,
      paddingBottom: 28,
      alignSelf: 'end'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 24
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
  }, "MODULE .04"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: WT2.mono,
      fontSize: 10.5,
      color: WT2.faint,
      letterSpacing: 2.5,
      textTransform: 'uppercase'
    }
  }, "// ABOUT")), /*#__PURE__*/React.createElement(Wordmark, {
    size: 38,
    glitch: false,
    style: {
      display: 'block'
    }
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '14px 0 0',
      fontFamily: WT2.sans,
      fontSize: 13.5,
      color: WT2.dim,
      maxWidth: 260,
      lineHeight: 1.5
    }
  }, "Lo-Fi House sound + Anime aesthetic.", /*#__PURE__*/React.createElement("br", null), "New transmissions every Saturday.", /*#__PURE__*/React.createElement("br", null), "A future independent label from the Wired.")), /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: '2 / 4',
      gridRow: 1,
      overflow: 'hidden',
      paddingBottom: 28
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "public/assets/images/51761_serial_experiments_lain.png",
    alt: "",
    style: {
      width: '100%',
      display: 'block',
      mixBlendMode: 'screen',
      marginTop: '-60px'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: 1,
      gridRow: 2,
      borderTop: `1px solid ${WT2.line}`,
      paddingTop: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: WT2.mono,
      fontSize: 9.5,
      color: WT2.faint,
      letterSpacing: 2.5,
      marginBottom: 7
    }
  }, "// TRANSMISSION"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: WT2.mono,
      fontSize: 11,
      color: WT2.faint,
      letterSpacing: 0.5,
      lineHeight: 1.6
    }
  }, "WEEBTRAX \xB7 LOW-FIDELITY HOUSE MIXES", /*#__PURE__*/React.createElement("br", null), "FROM CYBERIA CAF\xC9 & CLUB")), /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: 2,
      gridRow: 2,
      borderTop: `1px solid ${WT2.line}`,
      paddingTop: 14
    }
  }, colLabel('// NAV'), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '10px 20px'
    }
  }, NAV.map(([label, id]) => /*#__PURE__*/React.createElement("a", {
    key: id,
    href: `#${id}`,
    onClick: e => {
      e.preventDefault();
      scrollTo(id);
    },
    className: "wt-flink",
    style: {
      fontFamily: WT2.mono,
      fontSize: 12.5,
      color: WT2.body,
      textDecoration: 'none',
      letterSpacing: 1.5,
      cursor: 'pointer'
    }
  }, label)))), /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: 3,
      gridRow: 2,
      borderTop: `1px solid ${WT2.line}`,
      paddingTop: 14
    }
  }, colLabel('// SOCIAL SIGNALS'), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '10px 20px'
    }
  }, SOCIALS.map(([label, url]) => /*#__PURE__*/React.createElement("a", {
    key: label,
    href: url,
    target: "_blank",
    rel: "noopener noreferrer",
    className: "wt-flink",
    style: {
      fontFamily: WT2.mono,
      fontSize: 12.5,
      color: WT2.body,
      textDecoration: 'none',
      letterSpacing: 1.5,
      display: 'flex',
      alignItems: 'center',
      gap: 5
    }
  }, label, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--wt-accent)',
      fontSize: 10,
      lineHeight: 1
    }
  }, "\u2197")))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 36,
      paddingTop: 20,
      borderTop: `1px solid ${WT2.line}`
    }
  }, /*#__PURE__*/React.createElement(BusinessContact, null)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 20,
      paddingTop: 16,
      borderTop: `1px solid ${WT2.line}`,
      fontFamily: WT2.mono,
      fontSize: 10.5,
      color: WT2.faint,
      letterSpacing: 0.5,
      flexWrap: 'wrap',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", null, "\xA9 2026 WEEBTRAX \xB7 NODE.227"), /*#__PURE__*/React.createElement("span", null, "wired://weebtrax \u2014 present day, present time", /*#__PURE__*/React.createElement(Cursor, {
    w: 7,
    h: 12
  })))));
}
Object.assign(window, {
  getMixes,
  Transmissions,
  Submissions,
  Cta,
  Footer
});