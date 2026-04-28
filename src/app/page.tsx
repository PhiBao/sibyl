"use client";

import { motion } from "framer-motion";
import PulseScoreRing from "@/components/PulseScoreRing";
import StatCard from "@/components/StatCard";
import TransactionHistory from "@/components/TransactionHistory";
import ScoreTimeline from "@/components/ScoreTimeline";
import { DEMO_AGENT, DEMO_TRANSACTIONS } from "@/lib/config";

export default function Dashboard() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated background mesh */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-pulse-green/10 rounded-full blur-[128px] float" />
          <div className="absolute top-40 right-1/4 w-72 h-72 bg-accent-blue/10 rounded-full blur-[96px] float" style={{ animationDelay: "-3s" }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-16">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="w-2 h-2 rounded-full bg-pulse-green pulse-ring" />
              <span className="text-sm text-text-secondary">Live on Kite Chain</span>
            </motion.div>
            <h1 className="text-5xl font-bold tracking-tight mb-4">
              Your Agent&apos;s <span className="text-pulse-green">Pulse</span>
            </h1>
            <p className="text-text-secondary text-lg max-w-xl mx-auto">
              Reputation earned through real transactions. Every payment builds trust.
            </p>
          </motion.div>

          {/* Main Score Display */}
          <div className="flex flex-col lg:flex-row items-center gap-16 mb-16">
            <motion.div
              className="flex-shrink-0"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.8, type: "spring" }}
            >
              <PulseScoreRing score={DEMO_AGENT.score} size={280} strokeWidth={14} />
            </motion.div>

            <div className="flex-1 w-full">
              <div className="grid grid-cols-2 gap-4">
                <StatCard
                  label="Success Rate"
                  value={`${DEMO_AGENT.successRate}%`}
                  change="0.3%"
                  positive={true}
                  icon="✓"
                  delay={0.4}
                />
                <StatCard
                  label="Transactions"
                  value={DEMO_AGENT.totalTransactions.toLocaleString()}
                  change="12 today"
                  positive={true}
                  icon="⚡"
                  delay={0.5}
                />
                <StatCard
                  label="Total Spent"
                  value={`$${DEMO_AGENT.totalSpent.toLocaleString()}`}
                  change="$340 this week"
                  positive={true}
                  icon="💰"
                  delay={0.6}
                />
                <StatCard
                  label="Avg Transaction"
                  value={`$${DEMO_AGENT.avgTransactionValue}`}
                  change="−$1.20"
                  positive={false}
                  icon="📊"
                  delay={0.7}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Details Section */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TransactionHistory transactions={DEMO_TRANSACTIONS} />
          <ScoreTimeline />
        </div>

        {/* Agent Info Card */}
        <motion.div
          className="glass rounded-2xl p-6 mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">Agent Identity</h3>
              <p className="text-text-secondary text-sm font-mono">{DEMO_AGENT.address}</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-text-tertiary text-xs mb-1">Member Since</p>
                <p className="text-sm font-medium">{DEMO_AGENT.memberSince}</p>
              </div>
              <div className="text-center">
                <p className="text-text-tertiary text-xs mb-1">Passport</p>
                <p className="text-sm font-medium text-pulse-green">✓ Verified</p>
              </div>
              <div className="text-center">
                <p className="text-text-tertiary text-xs mb-1">Chain</p>
                <p className="text-sm font-medium">Kite (2366)</p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
