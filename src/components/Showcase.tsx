import { useEffect, useState } from "react";
import { motion } from "motion/react";

interface Entry {
  username: string;
  alias?: string;
  description?: string;
  avatar_url?: string | null;
  bg?: string | null;
}

const Fill = (Arr: Entry[], N: number): Entry[] => {
  const Out: Entry[] = [];
  while (Out.length < N && Arr.length) Out.push(...Arr);
  return Out.slice(0, N);
};

const Card = ({ E }: { key?: any; E: Entry }) => (
  <a href={`/${E.username}`} target="_blank" rel="noreferrer" className="group relative block w-[260px] shrink-0 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02] transition-colors hover:border-white/20">
    <div className="flex items-center gap-1.5 border-b border-white/[0.06] bg-black/40 px-2.5 py-2">
      <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
      <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
      <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
      <span className="ml-1.5 flex-1 truncate rounded-md bg-white/[0.05] px-2 py-0.5 font-mono text-[10px] text-white/45">sire.lol/{E.username}</span>
    </div>
    <div className="relative h-[150px]">
      {E.bg && (
        <img
          src={String(E.bg)}
          alt=""
          onError={(e) => { e.currentTarget.style.display = "none"; }}
          className="absolute inset-0 h-full w-full object-cover opacity-70 transition-transform duration-500 group-hover:scale-105"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/50" />
      <div className="relative flex h-full flex-col items-center px-4 pt-4 text-center">
        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/25 bg-white/10">
          {E.avatar_url ? (
            <img src={String(E.avatar_url)} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white/50">
              {(E.alias || E.username)[0].toUpperCase()}
            </div>
          )}
        </div>
        <p className="mt-2 max-w-full truncate text-sm font-bold lowercase">{E.alias || E.username}</p>
        <div className="mt-1.5 flex gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="h-1 w-1 rounded-full bg-white/30" />
          ))}
        </div>
        {E.description && (
          <p className="mt-1.5 max-w-full truncate text-[10px] text-white/45">
            {E.description.split("\n")[0].trim()}
          </p>
        )}
      </div>
    </div>
    <div className="flex flex-col gap-2 px-6 pb-5 pt-2">
      <div className="h-2 rounded-full bg-white/80 shadow-[0_0_12px_rgba(255,255,255,0.35)]" />
      <div className="h-1.5 w-2/3 rounded-full bg-white/25" />
    </div>
  </a>
);

export const Showcase = () => {
  const [rows, setRows] = useState<Entry[][]>([]);
  useEffect(() => {
    fetch(`/api/leaderboard?period=all`)
      .then(async (R) => {
        const J = await R.json().catch(() => null);
        const Top = (((J?.entries || []) as Entry[]) || []).slice(0, 30);
        const Seq1 = Fill(Top.slice(0, 15), 15);
        const Seq2 = Fill(Top.slice(15, 30).length ? Top.slice(15, 30) : Top.slice(0, 15), 15);
        setRows([Seq1, Seq2]);
      })
      .catch(() => {});
  }, []);

  if (rows.every((r) => r.length === 0)) return null;

  return (
    <section className="relative overflow-hidden py-24">
      <div className="mx-auto mb-14 max-w-7xl px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-5xl font-black lowercase tracking-tighter text-white"
        >
          pages people made.
        </motion.h2>
      </div>
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
        <div className="overflow-hidden">
          <div className="flex w-max py-2 hover:[animation-play-state:paused]" style={{ marginLeft: -70, animation: "mq-left 55s linear infinite" }}>
            {[0, 1].map((Copy) => (
              <div key={`c1-${Copy}`} className="flex gap-4 pr-4" aria-hidden={Copy === 1}>
                {rows[0].map((E, i) => (
                  <Card key={`r1-${Copy}-${i}`} E={E} />
                ))}
              </div>
            ))}
          </div>
          <div className="flex w-max py-2 hover:[animation-play-state:paused]" style={{ marginLeft: -160, animation: "mq-right 65s linear infinite" }}>
            {[0, 1].map((Copy) => (
              <div key={`c2-${Copy}`} className="flex gap-4 pr-4" aria-hidden={Copy === 1}>
                {rows[1].map((E, i) => (
                  <Card key={`r2-${Copy}-${i}`} E={E} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
};
