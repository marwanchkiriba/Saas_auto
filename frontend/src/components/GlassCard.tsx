import { motion } from "framer-motion";
import { ReactNode } from "react";

export function GlassCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-2xl border border-slate-800/70 bg-slate-900/70 backdrop-blur shadow-xl shadow-black/30 ${className}`}
    >
      {children}
    </motion.div>
  );
}
