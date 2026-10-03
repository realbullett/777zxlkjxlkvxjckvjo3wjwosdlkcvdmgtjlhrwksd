import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronDown, Crown, Eye, TrendingUp, Trophy } from "lucide-react";
import SEO from "../components/SEO";
import { VerifiedIcon } from "../components/VerifiedIcon";
// fuhhh profile reads go via /api now cuhhh :broken_heart:

type Entry = {
  rank: number;
  user_id: number;
  username: string;
  avatar_url: string | null;
  views: number;
  badges: string[];
};

type Period = "all" | "month";

const compact = (n: number) => {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
};

const REDUCED = typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function CountUp({ value, format, delay = 0, duration = 1100 }: { value: number; format: (n: number) => string; delay?: number; duration?: number }) {
  const [text, setText] = useState(() => (REDUCED ? format(value) : format(0)));
  useEffect(() => {
    if (REDUCED) { setText(format(value)); return; }
    let raf = 0;
    const timer = setTimeout(() => {
      let t0: number | null = null;
      const step = (t: number) => {
        if (t0 === null) t0 = t;
        const k = Math.min(1, (t - t0) / duration);
        const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        setText(format(Math.round(value * e)));
        if (k < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, delay);
    return () => { clearTimeout(timer); cancelAnimationFrame(raf); };
  }, [value]);
  return <>{text}</>;
}

const BADGE_FILES: Record<string, string> = {
  og: "og.png",
  premium: "premium.webp",
  booster: "booster.webp",
  staff: "staff.webp",
  bug: "bug.png",
  corrupt: "corrupt.png",
  owner: "owner.webp",
};

const BADGE_INFO: Record<string, [string, string]> = {
  og: ["OG", "secured this badge in the early days of sire.lol"],
  premium: ["Premium", "exclusive badge for premium supporters"],
  verified: ["Verified", "officially verified account on sire.lol"],
  booster: ["Booster", "thank you for boosting the discord server"],
  staff: ["Staff", "member of the sire.lol staff team"],
  bug: ["bug hunter", "reported bugs that made sire.lol better"],
  corrupt: ["Corrupt", "corrupted... don't ask questions"],
  owner: ["Owner", "the owner of sire.lol"],
};

type Tip = { x: number; top: number; name: string; desc: string } | null;

const CROWN_FILL: Record<string, string> = { p1: "#facc15", p2: "#d1d5db", p3: "#b45309" };
const CROWN_SIZE: Record<string, number> = { p1: 36, p2: 30, p3: 30 };

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>("all");
  const [data, setData] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [openSel, setOpenSel] = useState<null | "metric" | "period">(null);
  const [tip, setTip] = useState<Tip>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?period=${period}`).then(async (R) => {
      const J = await R.json().catch(() => null);
      const rows = J?.entries || [];
      setData(rows.map((e: any, i: number) => ({
        rank: i + 1,
        user_id: e.user_id,
        username: e.username || "unknown",
        avatar_url: e.avatar_url,
        views: Number(e.views || 0),
        badges: Array.isArray(e.badges) ? e.badges.map((b: any) => String(b)) : [],
      })));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [period]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!(e.target as HTMLElement)?.closest?.(".lb-sel")) setOpenSel(null);
    };
    const hide = () => setTip(null);
    document.addEventListener("click", close);
    document.addEventListener("scroll", hide, true);
    return () => { document.removeEventListener("click", close); document.removeEventListener("scroll", hide, true); };
  }, []);

  const showTip = (el: HTMLElement, id: string) => {
    const r = el.getBoundingClientRect();
    const info = BADGE_INFO[id] || [id, "exclusive sire.lol badge"];
    const h = 52;
    const x = Math.max(110, Math.min(window.innerWidth - 110, r.left + r.width / 2));
    const above = r.top - h - 12 > 8;
    setTip({ x, top: above ? r.top - h - 10 : r.bottom + 10, name: info[0], desc: info[1] });
  };

  const badgeEls = (badges: string[], limit: number | null, size: number) => {
    const list = limit ? badges.slice(0, limit) : badges;
    return list.map((b) => (
      <span
        key={b}
        className="lb-badge"
        onMouseEnter={(e) => showTip(e.currentTarget, b)}
        onMouseLeave={() => setTip(null)}
      >
        {b === "verified" ? (
          <VerifiedIcon className="lb-bdg" />
        ) : BADGE_FILES[b] ? (
          <img className="lb-bdg" src={`/emojis/${BADGE_FILES[b]}`} alt="" style={size !== 18 ? { width: size, height: size } : undefined} />
        ) : null}
      </span>
    ));
  };

  const avatarEl = (e: Entry, cls: string) => (
    <div className={cls}>
      {e.avatar_url ? (
        <img src={e.avatar_url} alt="" />
      ) : (
        <div className="lb-init">{e.username.charAt(0).toUpperCase()}</div>
      )}
    </div>
  );

  const top3 = data.slice(0, 3);
  const rest = data.slice(3);
  const totalViews = data.reduce((a, b) => a + b.views, 0);
  const stars = useRef(Array.from({ length: 28 }, (_, i) => ({
    x: (i * 37 + 11) % 100,
    y: (i * 53 + 7) % 100,
    s: 1 + (i % 3),
    d: (i * 0.23).toFixed(2),
  })));

  const pods = [
    { e: top3.find((x) => x.rank === 2), cls: "p2", rank: 2, delay: 1200 },
    { e: top3.find((x) => x.rank === 1), cls: "p1", rank: 1, delay: 350 },
    { e: top3.find((x) => x.rank === 3), cls: "p3", rank: 3, delay: 2100 },
  ];

  return (
    <div className="relative min-h-screen bg-black overflow-hidden" style={{ background: "#0a0a0a" }}>
      <SEO title="sire.lol — leaderboard" description="top profiles on sire.lol ranked by views." path="/leaderboard" />
      <div className="lb-bgfx">
        <div className="lb-orb lb-o1" />
        <div className="lb-orb lb-o2" />
        <div className="lb-orb lb-o3" />
        {stars.current.map((s, i) => (
          <span key={i} className="lb-star" style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, animationDelay: `${s.d}s` }} />
        ))}
      </div>

      <div className="lb-wrap">
        <Link to="/" className="lb-back">
          <ArrowLeft size={14} />
          back
        </Link>

        <div className="lb-hero">
          <div style={{ position: "relative", zIndex: 1 }}>
            <div className="lb-hero-title">
              <Trophy size={22} color="#fde047" />
              leaderboard
            </div>
            <p className="lb-hero-sub">the most viewed profiles, ranked.</p>
          </div>
          <div className="lb-hero-total">
            <b><CountUp key={period} value={totalViews} format={compact} /></b>
            <span><TrendingUp size={12} /> total views</span>
          </div>
        </div>

        <div className="lb-selects-row">
          <div className="lb-selects">
            <div className={`lb-sel${openSel === "metric" ? " lb-open" : ""}`}>
              <button onClick={() => setOpenSel(openSel === "metric" ? null : "metric")}>
                <span className="lb-lbl">
                  <Eye size={15} fill="currentColor" opacity={0.6} />
                  Views
                </span>
                <ChevronDown size={12} className="lb-chev" strokeWidth={2.5} />
              </button>
              <div className="lb-menu">
                <button className="lb-on" onClick={() => setOpenSel(null)}>Views</button>
              </div>
            </div>
            <div className={`lb-sel${openSel === "period" ? " lb-open" : ""}`}>
              <button onClick={() => setOpenSel(openSel === "period" ? null : "period")}>
                <span className="lb-lbl">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.6 }}><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" /></svg>
                  {period === "all" ? "All time" : "This month"}
                </span>
                <ChevronDown size={12} className="lb-chev" strokeWidth={2.5} />
              </button>
              <div className="lb-menu">
                <button className={period === "all" ? "lb-on" : ""} onClick={() => { setPeriod("all"); setOpenSel(null); }}>All time</button>
                <button className={period === "month" ? "lb-on" : ""} onClick={() => { setPeriod("month"); setOpenSel(null); }}>This month</button>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-6 h-6 border-2 border-blue-500/40 border-t-blue-400 rounded-full animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-sm text-white/20">No data yet</p>
          </div>
        ) : (
          <>
            {top3.length > 0 && (
              <div className="lb-stage" key={`stage-${period}`}>
                <div className="lb-podium">
                  {pods.map((p) => {
                    if (!p.e) return null;
                    const e = p.e;
                    return (
                      <Link key={e.rank} to={`/${e.username}`} className={`lb-pod lb-${p.cls}`}>
                        <div className="lb-crown-float">
                          <Crown size={CROWN_SIZE[p.cls]} fill={CROWN_FILL[p.cls]} color={CROWN_FILL[p.cls]} strokeWidth={1} />
                        </div>
                        {avatarEl(e, "lb-av")}
                        <div className="lb-uname">
                          <span className="lb-plink">{e.username}</span>
                          {badgeEls(e.badges, 2, 18)}
                        </div>
                        <span className="lb-vpill">
                          <Eye size={12} />
                          <CountUp value={e.views} format={(n) => String(n)} delay={p.delay} duration={1400} />
                        </span>
                        <div className="lb-ped">{p.rank}</div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {rest.length > 0 && (
              <div className="lb-panel">
                <div className="lb-thead">
                  <span className="lb-c-rank">Rank</span>
                  <span className="lb-c-user">User</span>
                  <span className="lb-c-score">Score</span>
                </div>
                {rest.map((e) => (
                  <Link key={e.rank} to={`/${e.username}`} className="lb-row">
                    <span className="lb-c-rank">#{e.rank}</span>
                    <span className="lb-c-user">
                      <span className="lb-who">
                        {avatarEl(e, "lb-rav")}
                        <span className="lb-rmeta">
                          <span className="lb-rname">
                            <span className="lb-plink">{e.username}</span>
                            {e.badges.length > 0 && (
                              <span className="lb-bbar">{badgeEls(e.badges, null, 14)}</span>
                            )}
                          </span>
                          <span className="lb-rhandle">@{e.username}</span>
                        </span>
                      </span>
                    </span>
                    <span className="lb-c-score">
                      <CountUp key={period} value={e.views} format={(n) => n.toLocaleString()} />
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {tip && (
        <div
          className="lb-tip-show"
          style={{
            position: "fixed", zIndex: 9999, pointerEvents: "none",
            left: tip.x, top: tip.top, transform: "translate(-50%, 0)",
            background: "#000", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10,
            padding: "8px 11px", whiteSpace: "nowrap", boxShadow: "0 8px 24px rgba(0,0,0,.6)", textAlign: "left",
          }}
        >
          <b style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#fff" }}>{tip.name}</b>
          <span style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,.55)", marginTop: 2 }}>{tip.desc}</span>
        </div>
      )}
    </div>
  );
}
