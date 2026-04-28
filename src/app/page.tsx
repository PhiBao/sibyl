"use client";

import PulseScoreRing from "@/components/PulseScoreRing";
import StatCard from "@/components/StatCard";
import { useAgentData } from "@/hooks/useAgentData";
import { useAccount, useConnect } from "wagmi";

export default function Dashboard() {
  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const agent = useAgentData();

  // Not connected — show onboarding
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md fade-in">
          <div className="w-16 h-16 rounded-2xl bg-pulse-green/10 flex items-center justify-center mx-auto mb-6">
            <div className="w-4 h-4 rounded-full bg-pulse-green pulse-ring" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-3">Connect Your Wallet</h1>
          <p className="text-text-secondary text-sm mb-8">
            Connect your wallet to view your agent&apos;s Pulse Score, transaction history, and reputation on Kite Chain.
          </p>
          <button
            onClick={() => {
              const injected = connectors.find((c) => c.id === "injected");
              if (injected) connect({ connector: injected });
            }}
            className="px-6 py-3 bg-pulse-green text-black text-sm font-semibold rounded-xl hover:bg-pulse-green/90 transition-all"
          >
            Connect Wallet
          </button>
          <p className="text-text-tertiary text-[11px] mt-4">
            New agent? Register after connecting to start building your Pulse Score.
          </p>
        </div>
      </div>
    );
  }

  // Connected but not registered
  if (!agent.exists && !agent.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md fade-in">
          <div className="text-4xl mb-4">🤖</div>
          <h1 className="text-2xl font-bold tracking-tight mb-3">Register Your Agent</h1>
          <p className="text-text-secondary text-sm mb-2">
            Your wallet is connected but no agent is registered yet.
          </p>
          <p className="text-text-tertiary text-[12px] mb-8 font-mono">{agent.address}</p>
          <button className="px-6 py-3 bg-pulse-green text-black text-sm font-semibold rounded-xl hover:bg-pulse-green/90 transition-all">
            Register Agent on Kite Chain
          </button>
          <p className="text-text-tertiary text-[11px] mt-4">
            This will create an on-chain attestation of your agent&apos;s identity.
          </p>
        </div>
      </div>
    );
  }

  // Registered — show dashboard
  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-1/3 w-[500px] h-[500px] bg-pulse-green/8 rounded-full blur-[160px] float" />
          <div className="absolute top-32 right-1/4 w-80 h-80 bg-accent-blue/6 rounded-full blur-[120px] float" style={{ animationDelay: "-3s" }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 pt-12 pb-16">
          <div className="flex justify-center mb-8 fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-[12px] text-text-secondary">
              <div className="w-1.5 h-1.5 rounded-full bg-pulse-green pulse-ring" />
              Live on Kite Chain · {agent.agentCount} agents registered
            </div>
          </div>

          <div className="flex flex-col items-center mb-12 fade-in-up" style={{ animationDelay: "0.1s" }}>
            <PulseScoreRing score={agent.score} size={220} strokeWidth={12} />
            <div className="mt-6 text-center">
              <h1 className="text-2xl font-bold tracking-tight mb-1">Your Agent&apos;s Pulse</h1>
              <p className="text-text-secondary text-sm">Reputation earned through real on-chain transactions</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
            <StatCard label="Success Rate" value={`${agent.successRate}%`} icon="✓" delay={0.2} />
            <StatCard label="Transactions" value={agent.totalTxns.toString()} icon="⚡" delay={0.3} />
            <StatCard label="Total Spent" value={`$${agent.totalSpent.toLocaleString()}`} icon="💰" delay={0.4} />
            <StatCard label="Avg Value" value={`$${agent.avgTxn}`} icon="📊" delay={0.5} />
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="glass rounded-xl p-5 fade-in" style={{ animationDelay: "0.6s" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-pulse-green/10 flex items-center justify-center text-sm">🤖</div>
            <div>
              <p className="text-[13px] font-medium">Agent Identity</p>
              <p className="text-[11px] text-text-tertiary font-mono">{agent.address}</p>
            </div>
            <div className="ml-auto flex items-center gap-4">
              <div className="text-center">
                <p className="text-[10px] text-text-tertiary uppercase tracking-wider">Since</p>
                <p className="text-xs font-medium">{agent.registeredAt || "—"}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-text-tertiary uppercase tracking-wider">Chain</p>
                <p className="text-xs font-medium">Kite Testnet</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-text-tertiary uppercase tracking-wider">Tier</p>
                <p className="text-xs font-medium" style={{ color: agent.tier.color }}>{agent.tier.label}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
