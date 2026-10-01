import { useState, useEffect, useMemo, useRef } from "react";

/* ───────────── constants ───────────── */

const HABITS = [
  "8 Hour Sleep",
  "Running & Workout",
  "Skin Care",
  "Cold Shower",
  "3L Water",
  "No Sugar / No Cold Drinks",
  "Learn Skills",
  "Make Money",
  "Study / Syllabus",
  "Time for Yourself",
];
const H = HABITS.length;
const TOTAL_DAYS = 92;
const THRESHOLD = 80;
const STORAGE_KEY = "winter-arc-2026";
const MONTH_NAMES = { 9: "OCTOBER", 10: "NOVEMBER", 11: "DECEMBER" };
const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const WEEKDAY = ["S", "M", "T", "W", "T", "F", "S"];

const DAYS = Array.from({ length: TOTAL_DAYS }, (_, i) => {
  const d = new Date(Date.UTC(2026, 9, 1) + i * 86400000);
  return {
    i,
    key: d.toISOString().slice(0, 10),
    month: d.getUTCMonth(),
    date: d.getUTCDate(),
    dow: d.getUTCDay(),
    label: `${MONTH_SHORT[d.getUTCMonth()]} ${d.getUTCDate()}`,
  };
});

const pad = (n) => String(n).padStart(2, "0");
const localTodayKey = () => {
  const n = new Date();
  return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`;
};

/* ───────────── storage ───────────── */
const memory = { v: null };
const store = {
  async get() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return memory.v;
    }
  },
  async set(v) {
    memory.v = v;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
    } catch (e) {
      console.error("Save failed", e);
    }
  },
};

/* ───────────── hooks ───────────── */

function useIsMobile(bp = 720) {
  const [m, setM] = useState(() => typeof window !== "undefined" && window.matchMedia(`(max-width:${bp}px)`).matches);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width:${bp}px)`);
    const fn = () => setM(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, [bp]);
  return m;
}

function useWidth(ref) {
  const [w, setW] = useState(640);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver((e) => setW(Math.max(260, Math.floor(e[0].contentRect.width))));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

/* ───────────── chart ───────────── */

function CompletionChart({ pct, lastIdx }) {
  const wrap = useRef(null);
  const width = useWidth(wrap);
  const [hover, setHover] = useState(null);
  const height = 300;
  const ml = 54, mr = 16, mt = 16, mb = 52;
  const iw = width - ml - mr;
  const ih = height - mt - mb;
  const x = (i) => ml + (i * iw) / (TOTAL_DAYS - 1);
  const y = (p) => mt + ih * (1 - p / 100);
  const narrow = width < 560;
  const step = narrow ? 14 : 7;
  const xTicks = DAYS.filter((d) => d.i % step === 0);

  const pts = lastIdx >= 0 ? pct.slice(0, lastIdx + 1) : [];
  const line = pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p).toFixed(1)}`).join(" ");
  const area = pts.length
    ? `${line} L${x(pts.length - 1).toFixed(1)} ${y(0)} L${x(0)} ${y(0)} Z`
    : "";

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left;
    const idx = Math.round(((px - ml) / iw) * (TOTAL_DAYS - 1));
    setHover(Math.min(TOTAL_DAYS - 1, Math.max(0, idx)));
  };

  const hv = hover !== null ? hover : null;
  const tipLeft = hv !== null ? Math.min(Math.max(x(hv), 70), width - 70) : 0;

  return (
    <div ref={wrap} className="chart-wrap">
      <svg
        width={width}
        height={height}
        role="img"
        aria-label="Line chart of daily completion percentage from 1 October to 31 December"
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setHover(null)}
        style={{ touchAction: "pan-y" }}
      >
        {[0, 25, 50, 75, 100].map((g) => (
          <g key={g}>
            <line x1={ml} x2={width - mr} y1={y(g)} y2={y(g)} className="grid" />
            <text x={ml - 10} y={y(g) + 4} textAnchor="end" className="axis">{g}%</text>
          </g>
        ))}
        <line x1={ml} x2={width - mr} y1={y(THRESHOLD)} y2={y(THRESHOLD)} className="thresh" />
        <text x={width - mr} y={y(THRESHOLD) - 6} textAnchor="end" className="axis thr-label">
          80% streak line
        </text>

        {xTicks.map((d) => (
          <text key={d.key} x={x(d.i)} y={height - mb + 20} textAnchor="middle" className="axis">
            {d.label}
          </text>
        ))}

        <text x={ml + iw / 2} y={height - 6} textAnchor="middle" className="axis-title">Date</text>
        <text
          transform={`translate(13 ${mt + ih / 2}) rotate(-90)`}
          textAnchor="middle"
          className="axis-title"
        >
          Daily Completion %
        </text>

        {pts.length > 0 && <path d={area} className="area" />}
        {pts.length > 0 && <path d={line} className="line" />}
        {pts.length > 0 && !narrow && pts.length <= 92 &&
          pts.map((p, i) => <circle key={i} cx={x(i)} cy={y(p)} r={2.4} className="dot" />)}

        {hv !== null && (
          <g>
            <line x1={x(hv)} x2={x(hv)} y1={mt} y2={mt + ih} className="guide" />
            {hv < pts.length && <circle cx={x(hv)} cy={y(pct[hv])} r={5} className="dot-hover" />}
          </g>
        )}
      </svg>

      {pts.length === 0 && (
        <div className="chart-empty">Check a habit to start your line.</div>
      )}

      {hv !== null && (
        <div className="tip" style={{ left: tipLeft, top: hv < pts.length ? y(pct[hv]) - 50 : mt + 6 }}>
          <b>{DAYS[hv].label}</b>
          <span>{pct[hv]}% · {pct[hv] / 10}/{H}</span>
        </div>
      )}
    </div>
  );
}

/* ───────────── app ───────────── */

export default function WinterArc() {
  const [checks, setChecks] = useState({}); // { "2026-10-01": "1010000000" }
  const [loaded, setLoaded] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const isMobile = useIsMobile();
  const scrollRef = useRef(null);

  const todayKey = useMemo(localTodayKey, []);
  const todayIdx = DAYS.findIndex((d) => d.key === todayKey);
  const afterEnd = todayKey > DAYS[TOTAL_DAYS - 1].key;
  const beforeStart = todayKey < DAYS[0].key;

  const [month, setMonth] = useState(() => {
    const t = DAYS[todayIdx];
    return t ? t.month : afterEnd ? 11 : 9;
  });

  /* load */
  useEffect(() => {
    let alive = true;
    store.get().then((saved) => {
      if (!alive) return;
      if (saved && saved.checks) setChecks(saved.checks);
      setLoaded(true);
    });
    return () => { alive = false; };
  }, []);

  /* derived stats */
  const stats = useMemo(() => {
    const counts = DAYS.map((d) => (checks[d.key] || "").split("1").length - 1);
    const pct = counts.map((c) => Math.round((c / H) * 100));
    const done = counts.reduce((a, b) => a + b, 0);
    const overall = Math.round((done / (TOTAL_DAYS * H)) * 100);

    let longest = 0, run = 0;
    pct.forEach((p) => {
      run = p >= THRESHOLD ? run + 1 : 0;
      if (run > longest) longest = run;
    });

    let current = 0;
    let anchor = todayIdx >= 0 ? todayIdx : afterEnd ? TOTAL_DAYS - 1 : -1;
    if (anchor >= 0) {
      // today still in progress: don't break streak until the day is over
      if (anchor === todayIdx && pct[anchor] < THRESHOLD) anchor -= 1;
      while (anchor >= 0 && pct[anchor] >= THRESHOLD) { current++; anchor--; }
    }

    let lastData = -1;
    counts.forEach((c, i) => { if (c > 0) lastData = i; });
    const timeline = todayIdx >= 0 ? todayIdx : afterEnd ? TOTAL_DAYS - 1 : -1;
    const lastIdx = Math.max(lastData, timeline);

    return { counts, pct, done, overall, longest, current, lastIdx };
  }, [checks, todayIdx, afterEnd]);

  /* save */
  useEffect(() => {
    if (!loaded) return;
    const daily = {};
    DAYS.forEach((d, i) => { daily[d.key] = stats.pct[i]; });
    store.set({
      version: 1,
      checks,
      progress: {
        daily,
        overall: stats.overall,
        currentStreak: stats.current,
        longestStreak: stats.longest,
      },
      notes: {},
      updatedAt: new Date().toISOString(),
    });
  }, [checks, loaded, stats]);

  /* scroll to today on desktop, top of month on mobile */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !loaded) return;
    if (isMobile) { el.scrollLeft = 0; return; }
    const th = el.querySelector("th[data-today]");
    if (th) el.scrollLeft = Math.max(0, th.offsetLeft - el.clientWidth / 2);
  }, [loaded, isMobile, month]);

  const toggle = (key, h) => {
    setChecks((prev) => {
      const row = (prev[key] || "0".repeat(H)).split("");
      row[h] = row[h] === "1" ? "0" : "1";
      const s = row.join("");
      const next = { ...prev };
      if (s.includes("1")) next[key] = s; else delete next[key];
      return next;
    });
  };

  const resetAll = () => {
    setChecks({});
    setConfirming(false);
  };

  const visible = isMobile ? DAYS.filter((d) => d.month === month) : DAYS;
  const monthSpans = [9, 10, 11].map((m) => ({ m, n: DAYS.filter((d) => d.month === m).length }));
  const plural = (n) => `${n} ${n === 1 ? "Day" : "Days"}`;

  return (
    <div className="wa">
      <header className="head">
        <h1>WINTER ARC</h1>
        <p className="range">1 OCT — 31 DEC 2026</p>
        <p className="count">92 DAYS</p>

        <div className="summary">
          <div className="bar" role="progressbar" aria-valuenow={stats.overall} aria-valuemin={0} aria-valuemax={100}>
            <i style={{ width: `${stats.overall}%` }} />
          </div>
          <span>{stats.done} of {TOTAL_DAYS * H} done · {stats.overall}%</span>
        </div>
      </header>

      {isMobile && (
        <div className="tabs" role="tablist">
          {[9, 10, 11].map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={month === m}
              className={month === m ? "tab active" : "tab"}
              onClick={() => setMonth(m)}
            >
              {MONTH_NAMES[m]}
            </button>
          ))}
        </div>
      )}

      <section className="card tracker" style={{ opacity: loaded ? 1 : 0.5, pointerEvents: loaded ? "auto" : "none" }}>
        <div className="scroll" ref={scrollRef}>
          <table>
            <thead>
              {!isMobile && (
                <tr className="months">
                  <th className="habit-col corner" />
                  {monthSpans.map(({ m, n }) => (
                    <th key={m} colSpan={n} className="month-th">{MONTH_NAMES[m]}</th>
                  ))}
                </tr>
              )}
              <tr>
                <th className="habit-col corner">Habit</th>
                {visible.map((d) => (
                  <th
                    key={d.key}
                    className={`day${d.i === todayIdx ? " is-today" : ""}${d.date === 1 ? " month-start" : ""}`}
                    {...(d.i === todayIdx ? { "data-today": true } : {})}
                  >
                    <span className="dow">{WEEKDAY[d.dow]}</span>
                    <span className="dnum">{d.date}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HABITS.map((name, h) => (
                <tr key={name}>
                  <th className="habit-col habit-name" scope="row">{name}</th>
                  {visible.map((d) => {
                    const on = (checks[d.key] || "")[h] === "1";
                    return (
                      <td
                        key={d.key}
                        className={`${d.i === todayIdx ? "is-today " : ""}${d.date === 1 ? "month-start" : ""}`}
                      >
                        <button
                          className={on ? "cell on" : "cell"}
                          aria-pressed={on}
                          aria-label={`${name}, ${d.label}`}
                          onClick={() => toggle(d.key, h)}
                        >
                          <svg viewBox="0 0 16 16" aria-hidden="true">
                            <path d="M3.5 8.6l3 3 6-7.2" />
                          </svg>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="pct-row">
                <th className="habit-col habit-name" scope="row">Daily completion</th>
                {visible.map((d) => {
                  const p = stats.pct[d.i];
                  return (
                    <td
                      key={d.key}
                      className={`pct${p >= THRESHOLD ? " hit" : ""}${p === 0 ? " zero" : ""}${d.i === todayIdx ? " is-today" : ""}${d.date === 1 ? " month-start" : ""}`}
                    >
                      {p}%
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="card chart-card">
        <CompletionChart pct={stats.pct} lastIdx={stats.lastIdx} />
      </section>

      <section className="stats">
        <div className="card stat">
          <span className="stat-label">Current Streak</span>
          <strong>{plural(stats.current)}</strong>
        </div>
        <div className="card stat">
          <span className="stat-label">Longest Streak</span>
          <strong>{plural(stats.longest)}</strong>
        </div>
        <div className="card stat">
          <span className="stat-label">Overall Completion</span>
          <strong>{stats.overall}%</strong>
        </div>
      </section>
      <p className="note">A streak day is any day at 80% or higher (8 of 10 habits).</p>

      <footer className="foot">
        {!confirming ? (
          <button className="reset" onClick={() => setConfirming(true)}>Reset Progress</button>
        ) : (
          <div className="confirm" role="alertdialog" aria-label="Confirm reset">
            <span>Delete all progress? This can't be undone.</span>
            <button className="reset" onClick={() => setConfirming(false)}>Cancel</button>
            <button className="reset danger" onClick={resetAll}>Delete everything</button>
          </div>
        )}
      </footer>
    </div>
  );
}

