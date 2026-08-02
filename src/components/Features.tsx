import { motion } from "motion/react";

export const Features = () => (
  <section className="px-6 py-24 border-t border-white/5 relative overflow-hidden">
    <div className="mx-auto max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="font-display text-5xl font-black text-white tracking-tighter mb-4 lowercase">
          ready-made <span className="text-blue-500">templates</span>
        </h2>
        <p className="text-lg text-white/30 lowercase max-w-xl mx-auto">
          pick a template, tweak the colors, and make it yours in seconds.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.15 }}
        className="glass-card rounded-3xl overflow-hidden border border-white/[0.06] max-w-4xl mx-auto"
      >
        <div className="grid lg:grid-cols-2 items-stretch">
          <div className="p-8 lg:p-12 flex flex-col justify-center">
            <span className="text-[10px] font-bold tracking-[0.2em] text-blue-500 uppercase mb-3">templates</span>
            <h3 className="text-3xl font-black text-white tracking-tight mb-4 lowercase">
              start fast, <br />
              <span className="text-gradient">finish faster.</span>
            </h3>
            <p className="text-sm text-white/40 leading-relaxed mb-6 lowercase">
              browse community-made templates or save your own setup as a template. colors, effects, layout — everything carries over so you never start from scratch.
            </p>
            <div className="flex flex-wrap gap-2">
              {["one-click install", "save your own", "community gallery", "customizable"].map((tag) => (
                <span key={tag} className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="relative min-h-[300px] bg-gradient-to-br from-blue-500/5 via-transparent to-transparent flex items-center justify-center p-8">
            <img src="/template/template.png" alt="template preview" className="w-full max-w-xs rounded-2xl border border-white/[0.06] shadow-2xl" />
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);
