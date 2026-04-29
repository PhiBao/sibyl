"use client";

import { useEffect, useState } from "react";
import { getScoreTier } from "@/lib/web3";

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
  const targetOffset = circumference * (1 - progress);

  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const timer = setTimeout(() => setOffset(targetOffset), 50);
    return () => clearTimeout(timer);
  }, [targetOffset]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <div
        className="absolute rounded-full blur-[50px] opacity-15"
        style={{
          width: size * 0.6,
          height: size * 0.6,
          background: tier.color,
        }}
      />
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1a1a1a"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tier.color}
          strokeWidth={strokeWidth}
          strokeLinecap="butt"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.5s ease-out", filter: `drop-shadow(0 0 4px ${tier.color}40)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-bold tracking-tighter leading-none fade-in font-mono"
          style={{ fontSize: size * 0.26, animationDelay: "0.3s", color: tier.color, textShadow: `0 0 12px ${tier.color}60` }}
        >
          {score}
        </span>
        <span
          className="text-[11px] font-bold mt-1.5 fade-in tracking-widest"
          style={{ color: tier.color, animationDelay: "0.5s" }}
        >
          {tier.label.toUpperCase()}
        </span>
      </div>
    </div>
  );
}
