import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Trophy } from "lucide-react";

export const Navbar = () => {
  return (
    <div className="fixed top-0 left-0 z-50 w-full px-4 py-4">
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto flex h-12 max-w-5xl items-center justify-between glass-card rounded-full px-5 glow-blue"
      >
        <div className="flex items-center gap-6">
          <Link to="/" className="block shrink-0">
            <img src="/logo.png" alt="sire.lol" className="h-7 w-auto" />
          </Link>
          
          <div className="hidden items-center gap-6 md:flex">
            <Link to="/" className="text-sm font-semibold text-white/40 transition-all hover:text-white">
              Home
            </Link>
            <Link to="/leaderboard" className="flex items-center gap-1.5 text-sm font-semibold text-white/40 transition-all hover:text-white">
              <Trophy size={14} />
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
              className="text-sm font-semibold text-white/40 transition-all hover:text-white flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" viewBox="0 0 127.14 96.36" fill="currentColor">
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
              </svg>
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
