import { motion } from "motion/react";
import { Check, X, Crown } from "lucide-react";

type Row = {
  feature: string;
  free: boolean;
  premium: boolean;
};

const ROWS: Row[] = [
  { feature: "biolink page", free: true, premium: true },
  { feature: "custom colors & fonts", free: true, premium: true },
  { feature: "free background effects", free: true, premium: true },
  { feature: "entry screens, music & cursor effects", free: true, premium: true },
  { feature: "seo & custom meta", free: true, premium: true },
  { feature: "premium background effects", free: false, premium: true },
  { feature: "premium name effects", free: false, premium: true },
  { feature: "media host (images & videos)", free: false, premium: true },
  { feature: "file host (any file)", free: false, premium: true },
  { feature: "exclusive premium badge", free: false, premium: true },
];

function Mark({ value, blue }: { value: boolean; blue?: boolean }) {
  return value ? (
    <Check size={16} className={blue ? "text-blue-400 drop-shadow-[0_0_6px_rgba(59,130,246,0.6)]" : "text-white/50"} />
  ) : (
    <X size={16} className="text-white/15" />
  );
}

export const Comparison = () => (
  <section className="px-6 py-24 border-t border-white/5 relative overflow-hidden">
    <div className="mx-auto max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="font-display text-5xl font-black text-white tracking-tighter mb-4 lowercase">
          free vs <span className="text-blue-500">premium</span>
        </h2>
        <p className="text-lg text-white/30 lowercase max-w-xl mx-auto">
          everything you need is free. premium just makes it prettier.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.15 }}
        className="relative shine-effect rounded-3xl overflow-hidden border border-blue-500/20 bg-white/[0.02] glow-blue"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(37,99,235,0.08),transparent_70%)] pointer-events-none" />

        <div className="relative grid grid-cols-[1fr_auto_auto] items-center px-6 py-5 border-b border-white/5">
          <span className="text-sm font-semibold text-white/80 lowercase">feature</span>
          <span className="w-24 text-center text-sm font-bold text-white/50 lowercase">free</span>
          <span className="w-28 text-center flex items-center justify-center gap-1.5 text-sm font-bold text-gradient-blue lowercase">
            <Crown size={14} className="text-blue-300" /> premium
          </span>
        </div>

        {ROWS.map((row, i) => (
          <div
            key={row.feature}
            className={`relative grid grid-cols-[1fr_auto_auto] items-center px-6 py-4 transition-colors ${
              i !== ROWS.length - 1 ? "border-b border-white/[0.04]" : ""
            } ${!row.free ? "bg-blue-600/[0.06]" : ""} hover:bg-white/[0.03]`}
          >
            <span className={`text-sm lowercase pr-3 ${!row.free ? "text-white/80 font-medium" : "text-white/50"}`}>{row.feature}</span>
            <span className="w-24 text-center"><Mark value={row.free} /></span>
            <span className="w-28 text-center"><Mark value={row.premium} blue={!row.free} /></span>
          </div>
        ))}

        <div className="relative flex justify-center py-6">
          <button
            onClick={() => {
              const hero = document.getElementById("hero");
              hero?.scrollIntoView({ behavior: "smooth" });
            }}
            className="shimmer rounded-full bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(37,99,235,0.4)]"
          >
            claim your page
          </button>
        </div>
      </motion.div>
    </div>
  </section>
);
