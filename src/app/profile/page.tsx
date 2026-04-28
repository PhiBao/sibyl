"use client";

import PulseScoreRing from "@/components/PulseScoreRing";
import { DEMO_AGENT, getScoreTier, SCORE_TIERS } from "@/lib/config";

export default function Profile() {
  const tier = getScoreTier(DEMO_AGENT.score);

  return (
    <div className="min-h-screen max-w-4xl mx-auto px-6 py-16">
      {/* Agent Header */}
      <div className="text-center mb-12 fade-in">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pulse-green/20 to-accent-blue/20 flex items-center justify-center text-3xl mx-auto mb-4 glow">
          🤖
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">{DEMO_AGENT.name}</h1>
        <p className="text-text-secondary font-mono text-sm">{DEMO_AGENT.address}</p>
        <div className="flex items-center justify-center gap-2 mt-3">
          <span className="px-3 py-1 rounded-full text-sm font-medium" style={{ background: `${tier.color}15`, color: tier.color }}>
            {tier.icon} {tier.label}
          </span>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-pulse-green/10 text-pulse-green">
            ✓ Passport Verified
          </span>
        </div>
      </div>

      {/* Score Ring */}
      <div className="flex justify-center mb-12 fade-in" style={{ animationDelay: "0.3s" }}>
        <PulseScoreRing score={DEMO_AGENT.score} size={220} />
      </div>

      {/* Score Breakdown */}
      <div className="glass rounded-2xl p-6 mb-6 fade-in" style={{ animationDelay: "0.5s" }}>
        <h3 className="text-lg font-semibold mb-6">Score Breakdown</h3>
        <div className="space-y-4">
          {[
            { label: "Transaction Success", value: 320, max: 400, color: "#30D158" },
            { label: "Payment Reliability", value: 210, max: 250, color: "#0A84FF" },
            { label: "Service Ratings", value: 140, max: 200, color: "#BF5AF2" },
            { label: "Time Weighted History", value: 72, max: 150, color: "#FF9F0A" },
          ].map((factor, i) => (
            <div key={factor.label}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-secondary">{factor.label}</span>
                <span className="text-sm font-mono">{factor.value}/{factor.max}</span>
              </div>
              <div className="h-2 bg-surface-overlay rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full score-bar-animate"
                  style={{
                    background: factor.color,
                    "--target-width": `${(factor.value / factor.max) * 100}%`,
                    animationDelay: `${0.8 + i * 0.1}s`,
                  } as React.CSSProperties}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Score Tiers Legend */}
      <div className="glass rounded-2xl p-6 mb-6 fade-in" style={{ animationDelay: "0.7s" }}>
        <h3 className="text-lg font-semibold mb-4">Reputation Tiers</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SCORE_TIERS.map((t) => (
            <div
              key={t.label}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                t.label === tier.label ? "glass-elevated border border-white/10" : ""
              }`}
            >
              <span className="text-xl">{t.icon}</span>
              <div>
                <p className="text-sm font-medium" style={{ color: t.color }}>{t.label}</p>
                <p className="text-xs text-text-tertiary">{t.min}–{t.max}</p>
              </div>
              {t.label === tier.label && (
                <span className="ml-auto text-xs text-pulse-green font-medium">← You</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Agent Stats */}
      <div className="glass rounded-2xl p-6 fade-in" style={{ animationDelay: "0.9s" }}>
        <h3 className="text-lg font-semibold mb-4">On-Chain Record</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Txns", value: DEMO_AGENT.totalTransactions.toString() },
            { label: "Success Rate", value: `${DEMO_AGENT.successRate}%` },
            { label: "Total Volume", value: `$${DEMO_AGENT.totalSpent.toLocaleString()}` },
            { label: "Active Since", value: DEMO_AGENT.memberSince },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-3 rounded-xl bg-surface/50">
              <p className="text-text-tertiary text-xs mb-1">{stat.label}</p>
              <p className="text-sm font-bold">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
