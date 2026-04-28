"use client";

import { getScoreTier } from "@/lib/config";

interface PulseScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export default function PulseScoreRing({ score, size = 240, strokeWidth = 12 }: PulseScoreRingProps) {
  const tier = getScoreTier(score);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = score / 1000;
  const offset = circumference * (1 - progress);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Background glow */}
      <div
        className="absolute inset-0 rounded-full blur-3xl opacity-30"
        style={{ background: tier.color }}
      />

      {/* SVG Ring */}
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#38383A"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tier.color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="score-ring-animate"
        />
        {/* Glow effect on the arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tier.color}
          strokeWidth={strokeWidth + 8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          opacity={0.15}
          filter="blur(8px)"
          className="score-ring-animate"
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-6xl font-bold tracking-tighter fade-in" style={{ animationDelay: "0.5s" }}>
          {score}
        </span>
        <span
          className="text-sm font-medium mt-1 fade-in"
          style={{ color: tier.color, animationDelay: "1.2s" }}
        >
          {tier.icon} {tier.label}
        </span>
      </div>
    </div>
  );
}
