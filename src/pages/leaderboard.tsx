import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Crown, Eye, Medal, TrendingUp, Trophy, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { supabase } from "../lib/supabase";
import SEO from "../components/SEO";

type Entry = {
  rank: number;
  user_id: number;
  username: string;
  avatar_url: string | null;
  views: number;
};

type Period = "all" | "month";

const compact = (n: number) => {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return n.toLocaleString();
};

const podium = [
  {
    rank: 2,
    height: "h-20",
    grad: "from-gray-500/80 to-gray-400/40",
    ring: "ring-gray-300",
    text: "text-gray-200",
    medal: "bg-gray-300",
  },
  {
    rank: 1,
    height: "h-28",
    grad: "from-yellow-400/80 to-amber-500/30",
    ring: "ring-yellow-400",
    text: "text-yellow-300",
    medal: "bg-yellow-400",
  },
  {
    rank: 3,
    height: "h-16",
    grad: "from-amber-700/70 to-amber-600/25",
    ring: "ring-amber-600",
    text: "text-amber-400",
    medal: "bg-amber-600",
  },
];

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>("all");
  const [data, setData] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    supabase.rpc("get_leaderboard", { period_type: period }).then(({ data: rows, error }) => {
      if (error || !rows) { setLoading(false); return; }
      setData((rows as any[]).map((e: any, i: number) => ({
        rank: i + 1,
        user_id: e.user_id,
        username: e.username || "unknown",
        avatar_url: e.avatar_url,
        views: e.views,
      })));
      setLoading(false);
    });
  }, [period]);

  const top3 = data.slice(0, 3);
  const rest = data.slice(3);
  const totalViews = data.reduce((a, b) => a + b.views, 0);

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      <SEO title="sire.lol — leaderboard" description="top profiles on sire.lol ranked by views." path="/leaderboard" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(37,99,235,0.08),transparent_70%)] pointer-events-none" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-2xl mx-auto px-4 py-16">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-white/30 hover:text-white/60 transition-colors mb-8">
          <ArrowLeft size={16} />
          back
        </Link>

        <div className="relative mb-8 overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-600 via-blue-500 to-white p-8 glow-blue">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_60%)] pointer-events-none" />
          <div className="absolute -top-12 -right-12 w-44 h-44 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-blue-300/20 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-[1] flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Trophy size={20} className="text-yellow-300" />
                <h1 className="font-display text-3xl font-black text-white tracking-tighter lowercase">leaderboard</h1>
              </div>
              <p className="text-sm text-white/80">the most viewed profiles, ranked.</p>
            </div>
            {totalViews > 0 && (
              <div className="flex flex-col items-end gap-1">
                <span className="text-2xl font-black text-white tabular-nums">{compact(totalViews)}</span>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-white/70">
                  <TrendingUp size={12} /> total views
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 mb-8">
          {(["all", "month"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`text-xs px-4 py-2 rounded-xl border font-bold transition-all cursor-pointer ${
                period === p
                  ? "bg-blue-600 border-blue-400/60 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                  : "bg-white/[0.03] border-white/10 text-white/40 hover:text-white/60"
              }`}
            >
              {p === "all" ? "All Time" : "This Month"}
            </button>
          ))}
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
              <motion.div
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.1 } } }}
                className="flex items-end justify-center gap-3 sm:gap-4 mb-6"
              >
                {podium.map((p) => {
                  const entry = top3.find((e) => e.rank === p.rank)!;
                  if (!entry) return null;
                  return (
                    <motion.div
                      key={entry.rank}
                      variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }}
                    >
                      <Link to={`/${entry.username}`} className="flex flex-col items-center w-24 sm:w-28 group">
                        <div className="relative mb-2">
                          <div className={`w-16 h-16 rounded-full overflow-hidden bg-white/[0.06] ring-2 ${p.ring} shadow-[0_0_24px_rgba(37,99,235,0.15)] group-hover:scale-105 transition-transform`}>
                            {entry.avatar_url ? (
                              <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-lg font-black text-white/20">
                                {entry.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <span className={`absolute -top-1 -right-1 w-6 h-6 rounded-full ${p.medal} flex items-center justify-center shadow-lg`}>
                            <Crown size={13} className="text-black" />
                          </span>
                        </div>
                        <span className="text-sm font-black text-white/90 group-hover:text-white truncate max-w-full transition-colors">
                          @{entry.username}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] font-bold text-white/40 mb-3">
                          <Eye size={11} /> {compact(entry.views)}
                        </span>
                        <div className={`w-full ${p.height} rounded-t-2xl bg-gradient-to-b ${p.grad} flex items-start justify-center pt-2 border border-white/10 border-b-0`}>
                          <span className={`text-xl font-black ${p.text}`}>{entry.rank}</span>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {rest.length > 0 && (
              <motion.div
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.05 } } }}
                className="glass-card rounded-3xl p-4"
              >
                <div className="space-y-1">
                  {rest.map((e) => (
                    <motion.div
                      key={e.rank}
                      variants={{ hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0 } }}
                    >
                      <Link
                        to={`/${e.username}`}
                        className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-blue-600/[0.06] border border-transparent hover:border-blue-500/20 transition-all group"
                      >
                        <span className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center text-xs font-black text-white/50 flex-shrink-0">
                          {e.rank}
                        </span>
                        <div className="w-9 h-9 rounded-full bg-white/[0.06] overflow-hidden flex-shrink-0 border border-white/[0.06]">
                          {e.avatar_url ? (
                            <img src={e.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm text-white/20 font-bold">
                              {e.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <span className="flex-1 text-sm font-semibold text-white/70 group-hover:text-white transition-colors truncate">
                          @{e.username}
                        </span>
                        <span className="flex items-center gap-1 text-xs font-bold text-white/35 tabular-nums">
                          <Eye size={12} /> {e.views.toLocaleString()}
                        </span>
                        <ChevronRight size={15} className="text-white/20 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
