"use client";

import { motion } from "framer-motion";

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
  icon: string;
  delay?: number;
}

export default function StatCard({ label, value, change, positive = true, icon, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      className="glass rounded-2xl p-6 hover:border-white/15 transition-all group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -2 }}
    >
      <div className="flex items-start justify-between mb-4">
        <span className="text-2xl">{icon}</span>
        {change && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            positive
              ? "bg-pulse-green/10 text-pulse-green"
              : "bg-danger/10 text-danger"
          }`}>
            {positive ? "↑" : "↓"} {change}
          </span>
        )}
      </div>
      <p className="text-text-secondary text-sm mb-1">{label}</p>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
    </motion.div>
  );
}
