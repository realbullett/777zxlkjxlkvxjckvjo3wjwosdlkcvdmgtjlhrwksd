import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import Logo from "./Logo";

export const Navbar = () => {
  const [shrunk, setShrunk] = useState(false);
  useEffect(() => {
    const onScroll = () => setShrunk(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className="fixed top-0 left-0 z-50 w-full px-4 py-4">
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1, maxWidth: shrunk ? "48rem" : "64rem" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto flex h-12 max-w-5xl items-center justify-between glass-card rounded-full px-5 glow-blue"
      >
        <div className="flex items-center gap-6">
          <Link to="/" className="block shrink-0">
            <Logo ClassName="h-7 w-7 text-base" />
          </Link>
          
          <div className="hidden items-center gap-6 md:flex">
            <Link to="/" className="text-sm font-semibold text-white/40 transition-all hover:text-white">
              Home
            </Link>
            <Link to="/leaderboard" className="text-sm font-semibold text-white/40 transition-all hover:text-white">
              Leaderboard
            </Link>
            <Link to="/privacy" className="text-sm font-semibold text-white/40 transition-all hover:text-white">
              Privacy
            </Link>
            <Link to="/terms" className="text-sm font-semibold text-white/40 transition-all hover:text-white">
              Terms
            </Link>
            <a
              href="https://discord.gg/npN6H47KEn"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-white/40 transition-all hover:text-white"
            >
              Discord
            </a>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/auth" className="text-sm font-semibold text-white/50 hover:text-white transition-colors">
            sign in
          </Link>
          <Link to="/auth" className="shimmer rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-white hover:text-black hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(37,99,235,0.3)]">
            register
          </Link>
        </div>
      </motion.nav>
    </div>
  );
};
