"use client";

import PulseScoreRing from "@/components/PulseScoreRing";
import StatCard from "@/components/StatCard";
import TransactionHistory from "@/components/TransactionHistory";
import ScoreTimeline from "@/components/ScoreTimeline";
import { DEMO_AGENT, DEMO_TRANSACTIONS } from "@/lib/config";

export default function Dashboard() {
  return (
    <div className="min-h-screen">
      {/* Hero — Score is the star */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-1/3 w-[500px] h-[500px] bg-pulse-green/8 rounded-full blur-[160px] float" />
          <div className="absolute top-32 right-1/4 w-80 h-80 bg-accent-blue/6 rounded-full blur-[120px] float" style={{ animationDelay: "-3s" }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 pt-12 pb-16">
          {/* Status Badge */}
          <div className="flex justify-center mb-8 fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-[12px] text-text-secondary">
              <div className="w-1.5 h-1.5 rounded-full bg-pulse-green pulse-ring" />
              Live on Kite Chain · Chain ID 2366
            </div>
          </div>

          {/* Score Hero */}
          <div className="flex flex-col items-center mb-12 fade-in-up" style={{ animationDelay: "0.1s" }}>
            <PulseScoreRing score={DEMO_AGENT.score} size={220} strokeWidth={12} />
            <div className="mt-6 text-center">
              <h1 className="text-2xl font-bold tracking-tight mb-1">Your Agent&apos;s Pulse</h1>
              <p className="text-text-secondary text-sm">Reputation earned through real transactions</p>
            </div>
          </div>

          {/* Stats Grid — clean 4-column */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
            <StatCard label="Success Rate" value={`${DEMO_AGENT.successRate}%`} change="+0.3%" positive icon="✓" delay={0.2} />
            <StatCard label="Transactions" value={DEMO_AGENT.totalTransactions.toLocaleString()} change="12 today" positive icon="⚡" delay={0.3} />
            <StatCard label="Total Spent" value={`$${DEMO_AGENT.totalSpent.toLocaleString()}`} change="+$340" positive icon="💰" delay={0.4} />
            <StatCard label="Avg Value" value={`$${DEMO_AGENT.avgTransactionValue}`} change="-$1.20" positive={false} icon="📊" delay={0.5} />
          </div>
        </div>
      </section>

      {/* Details Section — Two-column */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Transactions — wider column */}
          <div className="lg:col-span-3">
            <TransactionHistory transactions={DEMO_TRANSACTIONS} />
          </div>
          {/* Chart + Agent Info — narrower */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <ScoreTimeline />
            {/* Agent Identity — compact */}
            <div className="glass rounded-2xl p-5 fade-in" style={{ animationDelay: "0.7s" }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-pulse-green/10 flex items-center justify-center text-sm">🤖</div>
                <div>
                  <p className="text-sm font-medium">Demo Agent</p>
                  <p className="text-[11px] text-text-tertiary font-mono">{DEMO_AGENT.address.slice(0, 10)}...{DEMO_AGENT.address.slice(-6)}</p>
                </div>
                <span className="ml-auto text-[11px] text-pulse-green bg-pulse-green/10 px-2 py-0.5 rounded-full">✓ Verified</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Since", value: DEMO_AGENT.memberSince },
                  { label: "Chain", value: "Kite" },
                  { label: "Tier", value: "Reliable" },
                ].map((item) => (
                  <div key={item.label} className="text-center py-2 rounded-lg bg-white/[0.02]">
                    <p className="text-[10px] text-text-tertiary uppercase tracking-wider">{item.label}</p>
                    <p className="text-xs font-medium mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
