import Link from "next/link";
import { motion } from "framer-motion";

export function QuickButton({ href, label, icon }: { href: string; label: string; icon?: React.ReactNode }) {
  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.99 }}>
      <Link
        href={href}
        className="block rounded-xl border border-slate-800 bg-slate-900/70 text-slate-100 px-4 py-3 text-sm font-semibold shadow-lg shadow-black/20 hover:border-cyan-400/60"
      >
        <span className="flex items-center gap-2">
          {icon}
          {label}
        </span>
      </Link>
    </motion.div>
  );
}
