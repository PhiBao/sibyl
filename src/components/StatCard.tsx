"use client";

interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  delay?: number;
}

export default function StatCard({ label, value, icon, delay = 0 }: StatCardProps) {
  return (
    <div
      className="glass rounded-xl p-4 hover:border-white/10 transition-all fade-in"
      style={{ animationDelay: `${delay}s` }}
    >
      <span className="text-base opacity-60 mb-2 block">{icon}</span>
      <p className="text-[11px] text-text-tertiary uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-xl font-bold tracking-tight">{value}</p>
    </div>
  );
}
