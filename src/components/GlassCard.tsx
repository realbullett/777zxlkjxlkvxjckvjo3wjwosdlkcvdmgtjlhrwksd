import React from "react";
import { motion } from "motion/react";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const GlassCard = ({ children, className = "", delay = 0 }: GlassCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`glass-border glass-bg relative overflow-hidden p-8 transition-all hover:border-blue-500/50 ${className}`}
    >
      <div className="absolute top-0 right-0 h-8 w-8 border-t border-r border-white/10" />
      <div className="absolute bottom-0 left-0 h-8 w-8 border-b border-l border-white/10" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};
