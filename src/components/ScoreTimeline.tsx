"use client";

const DEMO_HISTORY = [
  { date: "W1", score: 320 },
  { date: "W2", score: 410 },
  { date: "W3", score: 485 },
  { date: "W4", score: 520 },
  { date: "W5", score: 590 },
  { date: "W6", score: 650 },
  { date: "W7", score: 688 },
  { date: "W8", score: 742 },
];

export default function ScoreTimeline() {
  const maxScore = 1000;
  const h = 140;
  const w = 400;
  const pad = { top: 16, right: 16, bottom: 24, left: 32 };
  const cw = w - pad.left - pad.right;
  const ch = h - pad.top - pad.bottom;

  const points = DEMO_HISTORY.map((p, i) => ({
    x: pad.left + (i / (DEMO_HISTORY.length - 1)) * cw,
    y: pad.top + ch - (p.score / maxScore) * ch,
    ...p,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${h - pad.bottom} L ${points[0].x} ${h - pad.bottom} Z`;

  return (
    <div className="glass rounded-2xl p-5 fade-in" style={{ animationDelay: "0.5s" }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[15px] font-semibold">Score Growth</h3>
          <p className="text-[12px] text-text-tertiary mt-0.5">8-week trajectory</p>
        </div>
        <span className="text-[11px] text-pulse-green bg-pulse-green/10 px-2 py-0.5 rounded font-medium">+422 pts</span>
      </div>

      <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
        {/* Grid */}
        {[0, 250, 500, 750, 1000].map((v) => {
          const y = pad.top + ch - (v / maxScore) * ch;
          return (
            <g key={v}>
              <line x1={pad.left} y1={y} x2={w - pad.right} y2={y} stroke="#1C1C1E" strokeWidth={1} />
              <text x={pad.left - 6} y={y + 3} textAnchor="end" fill="#48484A" fontSize={9} fontFamily="monospace">{v}</text>
            </g>
          );
        })}

        {/* X labels */}
        {points.map((p, i) => (
          <text key={i} x={p.x} y={h - 4} textAnchor="middle" fill="#48484A" fontSize={9} fontFamily="monospace">{p.date}</text>
        ))}

        {/* Area */}
        <path d={areaPath} fill="url(#scoreGrad)" opacity={0.25} />

        {/* Line */}
        <path
          d={linePath} fill="none" stroke="#30D158"
          strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
          className="score-line-animate"
        />

        {/* Points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={3} fill="#30D158" className="fade-in" style={{ animationDelay: `${1 + i * 0.08}s` }} />
            {/* Value labels on last 2 points */}
            {i >= points.length - 2 && (
              <text x={p.x} y={p.y - 8} textAnchor="middle" fill="#30D158" fontSize={9} fontWeight="600" fontFamily="monospace"
                className="fade-in" style={{ animationDelay: `${1.2 + i * 0.08}s` }}>
                {p.score}
              </text>
            )}
          </g>
        ))}

        <defs>
          <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#30D158" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#30D158" stopOpacity={0} />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
