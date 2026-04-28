"use client";

import { motion } from "framer-motion";

interface ScoreHistoryPoint {
  date: string;
  score: number;
}

const DEMO_HISTORY: ScoreHistoryPoint[] = [
  { date: "Week 1", score: 320 },
  { date: "Week 2", score: 410 },
  { date: "Week 3", score: 485 },
  { date: "Week 4", score: 520 },
  { date: "Week 5", score: 590 },
  { date: "Week 6", score: 650 },
  { date: "Week 7", score: 688 },
  { date: "Week 8", score: 742 },
];

export default function ScoreTimeline() {
  const maxScore = 1000;
  const height = 160;
  const width = 500;
  const padding = 20;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = DEMO_HISTORY.map((p, i) => ({
    x: padding + (i / (DEMO_HISTORY.length - 1)) * chartWidth,
    y: padding + chartHeight - (p.score / maxScore) * chartHeight,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <motion.div
      className="glass rounded-2xl p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <h3 className="text-lg font-semibold mb-1">Score Growth</h3>
      <p className="text-text-secondary text-sm mb-4">8-week trajectory</p>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        {/* Grid lines */}
        {[0, 250, 500, 750, 1000].map((v) => {
          const y = padding + chartHeight - (v / maxScore) * chartHeight;
          return (
            <g key={v}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#38383A" strokeWidth={0.5} />
              <text x={padding - 5} y={y + 4} textAnchor="end" fill="#636366" fontSize={10}>{v}</text>
            </g>
          );
        })}

        {/* Area fill */}
        <motion.path
          d={areaPath}
          fill="url(#gradient)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 1, duration: 1 }}
        />

        {/* Line */}
        <motion.path
          d={linePath}
          fill="none"
          stroke="#30D158"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.8, duration: 1.5, ease: "easeOut" }}
        />

        {/* Data points */}
        {points.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={4}
            fill="#30D158"
            initial={{ opacity: 0, r: 0 }}
            animate={{ opacity: 1, r: 4 }}
            transition={{ delay: 1.5 + i * 0.1 }}
          />
        ))}

        {/* Gradient definition */}
        <defs>
          <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#30D158" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#30D158" stopOpacity={0} />
          </linearGradient>
        </defs>
      </svg>
    </motion.div>
  );
}
