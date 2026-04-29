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
      className="terminal-panel p-4 hover:border-neon-green/30 transition-all fade-in"
      style={{ animationDelay: `${delay}s` }}
    >
      <span className="text-base opacity-60 mb-2 block">{icon}</span>
      <p className="text-[10px] text-text-tertiary uppercase tracking-widest font-bold mb-1">{label}</p>
      <p className="text-xl font-bold tracking-tight font-mono text-text-primary">{value}</p>
    </div>
  );
}
