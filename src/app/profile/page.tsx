"use client";

import PulseScoreRing from "@/components/PulseScoreRing";
import { useAgentData } from "@/hooks/useAgentData";
import { useAccount, useConnect } from "wagmi";
import { SCORE_TIERS } from "@/lib/web3";

export default function Profile() {
  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const agent = useAgentData();

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md fade-in">
          <h1 className="text-2xl font-bold tracking-tight mb-3">Connect Wallet</h1>
          <p className="text-text-secondary text-sm mb-8">Connect to view your agent profile and reputation.</p>
          <button
            onClick={() => {
              const injected = connectors.find((c) => c.id === "injected");
              if (injected) connect({ connector: injected });
            }}
            className="px-6 py-3 bg-pulse-green text-black text-sm font-semibold rounded-xl hover:bg-pulse-green/90 transition-all"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  if (!agent.exists) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md fade-in">
          <div className="text-4xl mb-4">🤖</div>
          <h1 className="text-2xl font-bold tracking-tight mb-3">No Agent Registered</h1>
          <p className="text-text-secondary text-sm mb-4">Register your agent on Kite Chain to start building reputation.</p>
          <p className="text-text-tertiary text-[12px] font-mono mb-8">{agent.address}</p>
          <button className="px-6 py-3 bg-pulse-green text-black text-sm font-semibold rounded-xl hover:bg-pulse-green/90 transition-all">
            Register Agent
          </button>
        </div>
      </div>
    );
  }

  const scoreBreakdown = [
    { label: "Transaction Success", value: Math.round(agent.score * 0.43), max: 400, color: "#30D158" },
    { label: "Payment Reliability", value: Math.round(agent.score * 0.28), max: 250, color: "#0A84FF" },
    { label: "Service Ratings", value: Math.round(agent.score * 0.19), max: 200, color: "#BF5AF2" },
    { label: "Time-Weighted History", value: Math.round(agent.score * 0.10), max: 150, color: "#FF9F0A" },
  ];

  return (
    <div className="min-h-screen max-w-3xl mx-auto px-6 py-12">
      <div className="text-center mb-10 fade-in">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pulse-green/15 to-accent-blue/15 flex items-center justify-center text-2xl mx-auto mb-4 glow">
          🤖
        </div>
        <h1 className="text-xl font-bold tracking-tight mb-1">Agent Profile</h1>
        <p className="text-[12px] text-text-tertiary font-mono mb-3">{agent.address}</p>
        <div className="flex items-center justify-center gap-2">
          <span className="text-[11px] font-medium px-2.5 py-1 rounded-full" style={{ background: `${agent.tier.color}15`, color: agent.tier.color }}>
            {agent.tier.icon} {agent.tier.label}
          </span>
          <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-pulse-green/10 text-pulse-green">
            ✓ On-Chain Verified
          </span>
        </div>
      </div>

      <div className="flex justify-center mb-10 fade-in-up" style={{ animationDelay: "0.2s" }}>
        <PulseScoreRing score={agent.score} size={180} />
      </div>

      <div className="glass rounded-xl p-5 mb-4 fade-in" style={{ animationDelay: "0.3s" }}>
        <h3 className="text-[14px] font-semibold mb-5">Score Breakdown</h3>
        <div className="space-y-4">
          {scoreBreakdown.map((f, i) => (
            <div key={f.label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12px] text-text-secondary">{f.label}</span>
                <span className="text-[11px] font-mono text-text-tertiary">{f.value}/{f.max}</span>
              </div>
              <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                <div
                  className="score-bar-animate rounded-full"
                  style={{ background: f.color, "--target-width": `${(f.value / f.max) * 100}%`, animationDelay: `${0.6 + i * 0.1}s` } as React.CSSProperties}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-xl p-5 mb-4 fade-in" style={{ animationDelay: "0.5s" }}>
        <h3 className="text-[14px] font-semibold mb-4">Reputation Tiers</h3>
        <div className="space-y-2">
          {SCORE_TIERS.map((t) => {
            const isCurrent = t.label === agent.tier.label;
            return (
              <div key={t.label} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${isCurrent ? "bg-white/[0.06] border border-white/10" : ""}`}>
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: t.color }} />
                <span className="text-[13px] font-medium flex-1" style={{ color: isCurrent ? t.color : undefined }}>{t.label}</span>
                <span className="text-[11px] font-mono text-text-tertiary">{t.min}–{t.max}</span>
                {isCurrent && <span className="text-[10px] text-pulse-green bg-pulse-green/10 px-1.5 py-0.5 rounded font-medium">You</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass rounded-xl p-5 fade-in" style={{ animationDelay: "0.7s" }}>
        <h3 className="text-[14px] font-semibold mb-4">On-Chain Record</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Total Transactions", value: agent.totalTxns.toString() },
            { label: "Success Rate", value: `${agent.successRate}%` },
            { label: "Total Volume", value: `$${agent.totalSpent.toLocaleString()}` },
            { label: "Active Since", value: agent.registeredAt || "—" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/[0.02] rounded-lg px-3 py-2.5">
              <p className="text-[10px] text-text-tertiary uppercase tracking-wider">{stat.label}</p>
              <p className="text-[14px] font-bold mt-0.5">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
