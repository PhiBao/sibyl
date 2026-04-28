"use client";

import { motion } from "framer-motion";
import { DEMO_MARKETPLACE, DEMO_AGENT, getScoreTier } from "@/lib/config";

export default function Marketplace() {
  const agentScore = DEMO_AGENT.score;

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold tracking-tight mb-2">Pulse Market</h1>
        <p className="text-text-secondary text-lg mb-12">
          Services priced by your reputation. Higher scores unlock better rates.
        </p>
      </motion.div>

      {/* Category filters */}
      <motion.div
        className="flex gap-3 mb-8 flex-wrap"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {["All", "API", "Data", "Compute", "Storage", "Creative"].map((cat) => (
          <button
            key={cat}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              cat === "All"
                ? "bg-pulse-green/10 text-pulse-green border border-pulse-green/20"
                : "glass text-text-secondary hover:text-text-primary"
            }`}
          >
            {cat}
          </button>
        ))}
      </motion.div>

      {/* Service Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {DEMO_MARKETPLACE.map((service, i) => {
          const accessible = agentScore >= service.minScore;
          const tier = getScoreTier(service.minScore);

          return (
            <motion.div
              key={service.id}
              className={`glass rounded-2xl p-6 transition-all ${
                accessible
                  ? "hover:border-pulse-green/30 cursor-pointer"
                  : "opacity-50"
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: accessible ? 1 : 0.5, y: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              whileHover={accessible ? { y: -4 } : undefined}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <span className="px-2 py-1 rounded-md text-xs font-medium bg-surface-overlay text-text-secondary">
                  {service.category}
                </span>
                {service.minScore > 0 && (
                  <span className="text-xs font-medium" style={{ color: tier.color }}>
                    {tier.icon} {service.minScore}+ required
                  </span>
                )}
              </div>

              {/* Info */}
              <h3 className="text-base font-semibold mb-1">{service.name}</h3>
              <p className="text-text-tertiary text-sm mb-4">{service.provider}</p>

              {/* Stats */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-text-tertiary text-xs">Price</p>
                  <p className="text-lg font-bold font-mono">${service.price}</p>
                </div>
                <div className="text-right">
                  <p className="text-text-tertiary text-xs">Latency</p>
                  <p className="text-sm font-medium">{service.latency}</p>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-4">
                {"★".repeat(Math.floor(service.rating))}
                <span className="text-text-secondary text-sm ml-1">{service.rating}</span>
              </div>

              {/* Action */}
              <button
                className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all ${
                  accessible
                    ? "bg-pulse-green/10 text-pulse-green border border-pulse-green/20 hover:bg-pulse-green/20"
                    : "bg-surface-overlay text-text-tertiary cursor-not-allowed"
                }`}
                disabled={!accessible}
              >
                {accessible ? "Pulse-Optimized Purchase" : `Need ${service.minScore}+ Score`}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Score gate explanation */}
      <motion.div
        className="glass rounded-2xl p-8 mt-12 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <h3 className="text-xl font-semibold mb-3">How Score Gates Work</h3>
        <p className="text-text-secondary max-w-2xl mx-auto">
          Service providers set minimum Pulse Score thresholds to ensure quality interactions.
          Build your reputation through successful transactions to unlock premium services
          and better pricing. Your score is verified on-chain — no shortcuts, no gaming.
        </p>
      </motion.div>
    </div>
  );
}
