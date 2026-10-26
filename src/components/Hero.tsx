import React, { useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";

export const Hero = () => {
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  const handleClaim = () => {
    if (username.trim()) {
      navigate(`/auth?username=${encodeURIComponent(username.trim())}`);
    }
  };

  return (
    <section id="hero" className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-24 pb-12 text-center overflow-hidden">
      <div className="relative z-10">

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="font-display max-w-7xl text-4xl font-black leading-[0.85] tracking-tighter text-white md:text-6xl lowercase"
        >
          your <motion.span
            className="bg-gradient-to-r from-blue-500 via-white to-blue-500 bg-[length:200%_100%] bg-clip-text text-transparent [text-shadow:0_0_40px_#3b82f6,0_0_80px_#3b82f6]"
            style={{ backgroundPositionX: "0%" }}
            animate={{ backgroundPositionX: ["0%", "100%", "0%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >biolink</motion.span> <br />
          <span className="text-gradient">one link.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 max-w-2xl mx-auto text-base font-medium text-white/40 md:text-xl lowercase leading-relaxed"
        >
          the free biolink platform — your page, your files, your link. no fluff, no limits.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 flex flex-col items-center gap-8"
        >
          <div className="relative w-full max-w-sm">
            <div className="relative flex h-12 w-full items-center rounded-xl bg-white/[0.03] pl-4 pr-1.5 backdrop-blur-xl border border-white/[0.06] ring-1 ring-white/5 focus-within:border-blue-500/30 focus-within:ring-blue-500/10 transition-all duration-300">
              <span className="text-xs font-semibold text-white mr-1 shrink-0 tracking-tight">sire.lol/</span>
              <input 
                type="text" 
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleClaim()}
                className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-white/[0.03] text-white/80"
              />
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleClaim}
                className="shimmer rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white tracking-tight"
              >
                claim
              </motion.button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 [perspective:1000px] [transform-style:preserve-3d]">
            <div
              style={{ transform: "perspective(1000px) rotateX(8deg) rotateY(12deg)" }}
              className="w-full max-w-[720px] aspect-video glass-card border border-white/10 rounded-2xl overflow-hidden"
            >
              <video autoPlay loop muted playsInline className="h-full w-full object-cover">
                <source src="/video/video1.mp4" type="video/mp4" />
              </video>
            </div>
            <div className="relative w-[640px] h-[560px] max-w-full">
              {[0, 1, 2].map((i) => {
                const offsets = [
                  { top: 0, left: 0 },
                  { top: 20, left: 170 },
                  { top: 40, left: 340 },
                ];
                return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.9 + i * 0.15 }}
                  className="absolute w-[280px] aspect-[9/16] glass-card border border-white/10 rounded-2xl overflow-hidden"
                  style={{
                    top: `${offsets[i].top}px`,
                    left: `${offsets[i].left}px`,
                    zIndex: i + 1,
                    transform: "perspective(1000px) rotateX(8deg) rotateY(-12deg)",
                  }}
                >
                  {i === 0 ? (
                    <video autoPlay loop muted playsInline className="h-full w-full object-cover">
                      <source src="/video/mobile1.mp4" type="video/mp4" />
                    </video>
                  ) : i === 1 ? (
                    <video autoPlay loop muted playsInline className="h-full w-full object-cover">
                      <source src="/video/mobile2.mp4" type="video/mp4" />
                    </video>
                  ) : (
                    <video autoPlay loop muted playsInline className="h-full w-full object-cover">
                      <source src="/video/mobile3.mp4" type="video/mp4" />
                    </video>
                  )}
                </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
