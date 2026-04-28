"use client";

import { DEMO_MARKETPLACE, DEMO_AGENT, getScoreTier } from "@/lib/config";

export default function Marketplace() {
  const agentScore = DEMO_AGENT.score;

  return (
    <div className="min-h-screen max-w-6xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-8 fade-in">
        <h1 className="text-2xl font-bold tracking-tight mb-1.5">Pulse Market</h1>
        <p className="text-text-secondary text-sm">
          Services priced by your reputation. Higher scores unlock better rates.
        </p>
      </div>

      {/* Score Gate Info — prominent, top of page */}
      <div className="glass rounded-xl p-4 mb-8 flex items-center gap-4 fade-in" style={{ animationDelay: "0.1s" }}>
        <div className="w-10 h-10 rounded-lg bg-pulse-green/10 flex items-center justify-center text-lg shrink-0">
          🛡️
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium">Your Pulse Score: <span className="text-pulse-green">{agentScore}</span></p>
          <p className="text-[12px] text-text-tertiary mt-0.5">
            Services with higher score requirements are locked. Build reputation through successful transactions to unlock them.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          {["Unverified", "Newcomer", "Trusted", "Reliable", "Elite"].map((t, i) => {
            const colors = ["#636366", "#FF9F0A", "#0A84FF", "#30D158", "#BF5AF2"];
            return (
              <div key={t} className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: colors[i] }} />
                <span className="text-[10px] text-text-tertiary">{t}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 mb-6 flex-wrap fade-in" style={{ animationDelay: "0.15s" }}>
        {["All", "API", "Data", "Compute", "Storage", "Creative"].map((cat, i) => (
          <button
            key={cat}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
              i === 0
                ? "bg-white/10 text-text-primary"
                : "text-text-tertiary hover:text-text-secondary hover:bg-white/[0.04]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Service Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {DEMO_MARKETPLACE.map((service, i) => {
          const accessible = agentScore >= service.minScore;
          const tier = getScoreTier(service.minScore);

          return (
            <div
              key={service.id}
              className={`glass rounded-xl overflow-hidden transition-all fade-in ${
                accessible
                  ? "hover:border-pulse-green/20 cursor-pointer"
                  : "opacity-60"
              }`}
              style={{ animationDelay: `${0.2 + i * 0.04}s` }}
            >
              {/* Card top — category + score badge */}
              <div className="px-4 pt-4 pb-3 flex items-center justify-between">
                <span className="text-[11px] text-text-tertiary uppercase tracking-wider">{service.category}</span>
                {service.minScore > 0 && (
                  <span className="text-[10px] font-medium flex items-center gap-1" style={{ color: tier.color }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: tier.color }} />
                    {service.minScore}+
                  </span>
                )}
              </div>

              {/* Card body */}
              <div className="px-4 pb-4">
                <h3 className="text-[14px] font-semibold mb-0.5 leading-tight">{service.name}</h3>
                <p className="text-[12px] text-text-tertiary mb-3">{service.provider}</p>

                {/* Stats row */}
                <div className="flex items-center gap-4 mb-3">
                  <div>
                    <p className="text-[10px] text-text-tertiary uppercase tracking-wider">Price</p>
                    <p className="text-[15px] font-bold font-mono">${service.price}</p>
                  </div>
                  <div className="w-px h-6 bg-white/[0.06]" />
                  <div>
                    <p className="text-[10px] text-text-tertiary uppercase tracking-wider">Latency</p>
                    <p className="text-[13px] font-medium">{service.latency}</p>
                  </div>
                  <div className="w-px h-6 bg-white/[0.06]" />
                  <div>
                    <p className="text-[10px] text-text-tertiary uppercase tracking-wider">Rating</p>
                    <p className="text-[13px] font-medium">
                      <span className="text-accent-orange">★</span> {service.rating}
                    </p>
                  </div>
                </div>

                {/* Action */}
                <button
                  className={`w-full py-2 rounded-lg text-[12px] font-semibold transition-all ${
                    accessible
                      ? "bg-pulse-green text-black hover:bg-pulse-green/90"
                      : "bg-white/[0.04] text-text-tertiary cursor-not-allowed"
                  }`}
                  disabled={!accessible}
                >
                  {accessible ? "Purchase" : `🔒 ${service.minScore}+ Required`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
