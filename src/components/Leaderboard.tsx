import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Crown, Eye, Trophy, X } from "lucide-react";
import { supabase } from "../lib/supabase";

type Entry = {
  rank: number;
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
  { rank: 2, height: "h-12", grad: "from-gray-500/80 to-gray-400/30", ring: "ring-gray-300", text: "text-gray-200", medal: "bg-gray-300" },
  { rank: 1, height: "h-16", grad: "from-yellow-400/80 to-amber-500/30", ring: "ring-yellow-400", text: "text-yellow-300", medal: "bg-yellow-400" },
  { rank: 3, height: "h-10", grad: "from-amber-700/70 to-amber-600/25", ring: "ring-amber-600", text: "text-amber-400", medal: "bg-amber-600" },
];

export default function Leaderboard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [period, setPeriod] = useState<Period>("all");
  const [data, setData] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    supabase.rpc("get_leaderboard", { period_type: period }).then(({ data, error }) => {
      if (error || !data) { setLoading(false); return; }
      setData((data as any[]).map((e: any, i: number) => ({
        rank: i + 1,
        username: e.username || "unknown",
        avatar_url: e.avatar_url,
        views: e.views,
      })));
      setLoading(false);
    });
  }, [open, period]);

  const top3 = data.slice(0, 3);
  const rest = data.slice(3);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="w-full max-w-lg max-h-[80vh] glass-card rounded-3xl p-6 overflow-hidden flex flex-col relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Trophy size={18} className="text-yellow-400" />
                <h2 className="text-lg font-black text-white tracking-tight">Leaderboard</h2>
              </div>
              <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="flex gap-2 mb-5">
              {(["all", "month"] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-bold transition-all cursor-pointer ${
                    period === p
                      ? "bg-blue-600 border-blue-400/60 text-white shadow-[0_0_16px_rgba(37,99,235,0.4)]"
                      : "bg-white/[0.03] border-white/10 text-white/40 hover:text-white/60"
                  }`}
                >
                  {p === "all" ? "All Time" : "This Month"}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-blue-500/40 border-t-blue-400 rounded-full animate-spin" />
              </div>
            ) : data.length === 0 ? (
              <p className="text-sm text-white/30 text-center py-12">No data yet</p>
            ) : (
              <div className="flex-1 overflow-y-auto min-h-0">
                {top3.length > 0 && (
                  <div className="flex items-end justify-center gap-3 mb-5">
                    {podium.map((p) => {
                      const entry = top3.find((e) => e.rank === p.rank)!;
                      if (!entry) return null;
                      return (
                        <div key={entry.rank} className="flex flex-col items-center w-20">
                          <div className="relative mb-1.5">
                            <div className={`w-12 h-12 rounded-full overflow-hidden bg-white/[0.06] ring-2 ${p.ring}`}>
                              {entry.avatar_url ? (
                                <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-sm font-black text-white/20">
                                  {entry.username.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full ${p.medal} flex items-center justify-center`}>
                              <Crown size={11} className="text-black" />
                            </span>
                          </div>
                          <span className="text-[11px] font-black text-white/90 truncate max-w-full">@{entry.username}</span>
                          <span className="flex items-center gap-1 text-[10px] font-bold text-white/40 mb-2">
                            <Eye size={10} /> {compact(entry.views)}
                          </span>
                          <div className={`w-full ${p.height} rounded-t-lg bg-gradient-to-b ${p.grad} flex items-start justify-center pt-1.5 border border-white/10 border-b-0`}>
                            <span className={`text-sm font-black ${p.text}`}>{entry.rank}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {rest.length > 0 && (
                  <div className="space-y-1">
                    {rest.map((e) => (
                      <div
                        key={e.rank}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-blue-600/[0.06] border border-transparent hover:border-blue-500/20 transition-all"
                      >
                        <span className="w-6 h-6 rounded-md bg-white/[0.04] border border-white/10 flex items-center justify-center text-[11px] font-black text-white/50 flex-shrink-0">
                          {e.rank}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-white/[0.06] overflow-hidden flex-shrink-0 border border-white/[0.06]">
                          {e.avatar_url ? (
                            <img src={e.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-white/20 font-bold">
                              {e.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <span className="flex-1 text-sm font-semibold text-white/80 truncate">
                          @{e.username}
                        </span>
                        <span className="flex items-center gap-1 text-xs font-bold text-white/40 tabular-nums">
                          <Eye size={12} /> {e.views.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
