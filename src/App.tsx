/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "motion/react";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { Comparison } from "./components/Comparison";
import { FAQ } from "./components/FAQ";
import { Background } from "./components/Background";
import { supabase } from "./lib/supabase";
import SEO from "./components/SEO";

export default function App() {
  const { scrollYProgress } = useScroll();
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);
  const [avatars, setAvatars] = useState<string[]>([]);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const marqueeInView = useInView(marqueeRef, { once: true, margin: "200px" });

  useEffect(() => {
    if (!marqueeInView) return;
    supabase
      .from("users")
      .select("avatar_url")
      .not("avatar_url", "is", null)
      .limit(30)
      .then(({ data }) => {
        if (data) {
          const urls = data
            .map((a) => a.avatar_url)
            .filter(Boolean)
            .sort(() => Math.random() - 0.5) as string[];
          setAvatars(urls);
        }
      });
  }, [marqueeInView]);

  const scrollToHero = () => {
    document.getElementById("hero")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative min-h-screen font-sans selection:bg-blue-500/30">
      <SEO title="sire.lol — free biolink | one link for everything" description="create your free biolink on sire.lol — drop your links, host your files, tell your story. no templates, no bullshit." path="/" />
      <Background />
      <Navbar />
      
      <main>
        <Hero />
        
        <Features />

        <Comparison />

        {/* Story Section */}
        <section className="px-6 py-24 border-y border-white/5 relative overflow-hidden">
          {/* Marquee Background */}
          <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 pointer-events-none opacity-[0.03] flex whitespace-nowrap">
             <motion.div
               animate={{ x: [0, -2000] }}
               transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="text-[15rem] font-black lowercase flex gap-40"
             >
                <span>sire.lol</span>
                <span>identity</span>
                <span>refined</span>
                <span>sire.lol</span>
                <span>identity</span>
                <span>refined</span>
             </motion.div>
          </div>

          <div className="mx-auto max-w-7xl relative z-10">
            <motion.div 
              style={{ scale }}
               className="grid gap-16 lg:grid-cols-2 items-center"
            >
                <div className="text-left">

                   <h2 className="font-display text-5xl font-black text-white tracking-tighter mb-6 leading-[0.85] lowercase">
                    one biolink. <br />
                    <span className="text-blue-500">zero limits.</span>
                  </h2>
                  <p className="text-lg text-white/30 leading-relaxed max-w-xl lowercase">
                    drop your links, host your files, tell your story. no templates, no bullshit.
                  </p>
                  <div className="mt-8 flex flex-wrap gap-4">
                     <button onClick={scrollToHero} className="shimmer btn-sharp bg-blue-600 text-white border-none shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:scale-105 active:scale-95">claim your page</button>
                     <motion.div
                       animate={{ rotate: 360 }}
                       transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                       className="h-10 w-10 rounded-full border border-blue-500/30 flex items-center justify-center"
                     >
                       <motion.div
                         animate={{ rotate: -360 }}
                         transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                         className="h-4 w-4 rounded-full bg-blue-500/50"
                       />
                     </motion.div>
                  </div>
               </div>
               
               <div className="relative group">
                   <div className="glass-card aspect-[3/4] w-full max-h-[600px] p-3 bg-gradient-to-br from-blue-500/20 via-transparent to-transparent">
                      <div className="h-full w-full bg-black/20 border border-white/5 relative overflow-hidden rounded-lg">
                         <video autoPlay loop muted playsInline className="h-full w-full object-cover">
                           <source src="/video/mobile4.mp4" type="video/mp4" />
                         </video>
                        {/* Scanning Effect */}
                        <motion.div 
                          animate={{ top: ["0%", "100%"] }}
                          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                          className="absolute left-0 right-0 h-1 bg-blue-500/50 blur-sm z-20"
                        />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
                     </div>
                  </div>
                  
                   {/* Status Badges */}
                   <motion.div
                     animate={{ y: [0, -10, 0] }}
                     transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                     className="absolute -bottom-8 -left-8 glass-card p-4 border-blue-500/30 backdrop-blur-3xl glow-blue"
                   >
                      <div className="flex items-center gap-4">
                         <div className="relative">
                           <div className="h-3 w-3 rounded-full bg-blue-500 animate-ping absolute" />
                           <div className="h-3 w-3 rounded-full bg-blue-500" />
                         </div>
                          <span className="text-sm font-black text-white tracking-[0.2em] uppercase">FREE</span>
                      </div>
                   </motion.div>


                </div>
            </motion.div>
          </div>
        </section>

        {/* Users Marquee */}
        <section ref={marqueeRef} className="px-6 py-24 relative overflow-hidden border-t border-white/5">
          <div className="mx-auto max-w-7xl text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="font-display text-5xl font-black text-white tracking-tighter mb-4 lowercase"
            >
              over <span className="text-blue-500">1k+</span> registered users
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-lg text-white/30 lowercase"
            >
              now it's your turn!
            </motion.p>
          </div>

          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

            <div className="overflow-hidden">
              {avatars.length > 0 && (
                <div className="marquee-track flex w-max py-4">
                  {avatars.concat([...avatars].sort(() => Math.random() - 0.5)).map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      className="w-16 h-16 rounded-full border-2 border-blue-500/20 flex-shrink-0 mr-6"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <FAQ />

        {/* Final CTA */}
        <section className="px-6 py-24 relative overflow-hidden">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="mx-auto max-w-5xl glass-card bg-blue-600/[0.03] p-16 text-center glow-blue border-blue-500/20 relative"
          >
             <h2 className="font-display text-5xl font-black text-white tracking-tighter mb-6 lowercase">
                ready to <span className="text-blue-500">join?</span>
             </h2>
             <p className="text-lg text-white/30 mb-8 max-w-xl mx-auto lowercase leading-relaxed">
                 join 1k+ creators building the future of digital identity on sire.lol.
             </p>
              <button onClick={scrollToHero} className="shimmer rounded-full bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(37,99,235,0.4)]">
                 claim your page
              </button>
          </motion.div>
        </section>
      </main>

      <footer className="px-6 py-8 text-center">
        <img src="/logo.png" alt="sire.lol" className="h-6 w-auto mx-auto" />
        <p className="mt-4 text-[10px] font-bold tracking-[0.2em] text-white/10">
          © 2026 sire.lol — refined identity
        </p>
      </footer>
    </div>
  );
}

