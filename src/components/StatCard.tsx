"use client";

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
    <div
      className="glass rounded-xl p-4 hover:border-white/10 transition-all fade-in"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-base opacity-60">{icon}</span>
        {change && (
          <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${
            positive ? "bg-pulse-green/10 text-pulse-green" : "bg-danger/10 text-danger"
          }`}>
            {positive ? "↑" : "↓"} {change}
          </span>
        )}
      </div>
      <p className="text-[11px] text-text-tertiary uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-xl font-bold tracking-tight">{value}</p>
    </div>
  );
}
