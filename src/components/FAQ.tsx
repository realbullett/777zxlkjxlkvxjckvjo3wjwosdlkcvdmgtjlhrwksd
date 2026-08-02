import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus } from "lucide-react";

const faqs = [
  {
    q: "What is sire.lol?",
    a: "sire.lol is a modern biolink platform designed for creators who value aesthetics and performance. We provide high-speed profile pages and secure file hosting."
  },
  {
    q: "Is sire.lol free?",
    a: "Yes, we offer a lifetime free plan that includes all essential features. For power users, our Premium plan offers advanced customization for a one-time fee."
  },
  {
    q: "Why choose sire.lol?",
    a: "Unlike other tools, sire.lol focuses on a zero-bloat, high-performance experience with intense customization options and a community-driven development cycle."
  },
  {
    q: "Is it safe?",
    a: "Security is our top priority. All links are scanned, and your data is protected by enterprise-grade encryption."
  },
  {
    q: "Can I host files?",
    a: "Yes, you can host and share files directly through your sire.lol page with no size limits on the free plan."
  },
  {
    q: "How do I customize my page?",
    a: "You get full control over your page layout, colors, fonts, and links through our dashboard. no templates, no limits."
  },
  {
    q: "Is there a mobile app?",
    a: "Not yet. sire.lol works perfectly in any mobile browser and we're working on native apps."
  }
];

export const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="px-6 py-24 relative overflow-hidden">
      <div className="mx-auto max-w-3xl">
        <div className="mb-16 text-center">
          <h2 className="font-display text-5xl font-black text-white tracking-tighter lowercase">
            frequently <span className="text-blue-500">asked.</span>
          </h2>
        </div>

        <div className="grid gap-2">
          {faqs.map((faq, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative rounded-xl overflow-hidden"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0"
                style={{
                  background: "conic-gradient(from 0deg, transparent, rgba(59,130,246,0.3), transparent, rgba(59,130,246,0.15), transparent)",
                }}
              />
              <div className="relative glass-card border-0 m-[1px] rounded-[11px] group hover:border-blue-500/20 transition-colors">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-center justify-between p-4 text-left relative z-10"
              >
                <span className="text-base font-bold text-white/80 tracking-tight group-hover:text-white transition-colors">{faq.q.toLowerCase()}</span>
                <motion.div 
                  animate={{ rotate: openIndex === i ? 45 : 0 }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.02] border border-white/5 transition-all group-hover:border-blue-500/30"
                >
                  <Plus className={`h-3.5 w-3.5 transition-colors ${openIndex === i ? "text-blue-500" : "text-white/20"}`} />
                </motion.div>
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="px-4 pb-4 text-sm font-medium leading-relaxed text-white/30 lowercase">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};