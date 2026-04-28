"use client";

import { getScoreTier } from "@/lib/config";

interface PulseScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export default function PulseScoreRing({ score, size = 220, strokeWidth = 10 }: PulseScoreRingProps) {
  const tier = getScoreTier(score);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = score / 1000;
  const offset = circumference * (1 - progress);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Subtle glow */}
      <div
        className="absolute inset-6 rounded-full blur-[60px] opacity-20"
        style={{ background: tier.color }}
      />

      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#1C1C1E" strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={tier.color}
          strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="score-ring-animate"
        />
      </svg>

      {/* Center */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[56px] font-bold tracking-tighter leading-none fade-in" style={{ animationDelay: "0.5s" }}>
          {score}
        </span>
        <span
          className="text-[13px] font-medium mt-1.5 fade-in"
          style={{ color: tier.color, animationDelay: "0.8s" }}
        >
          {tier.icon} {tier.label}
        </span>
      </div>
    </div>
  );
}
