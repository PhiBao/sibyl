"use client";

import { useAgentData } from "@/hooks/useAgentData";
import { useAccount, useConnect } from "wagmi";

const SERVICES = [
  { id: 1, name: "GPT-4 Turbo Inference", provider: "OpenRouter", category: "API", price: 0.03, minScore: 0, rating: 4.9, latency: "120ms" },
  { id: 2, name: "Claude 3.5 Sonnet", provider: "Anthropic", category: "API", price: 0.015, minScore: 200, rating: 4.8, latency: "95ms" },
  { id: 3, name: "Real-time Price Feeds", provider: "Chainlink", category: "Data", price: 0.10, minScore: 400, rating: 5.0, latency: "50ms" },
  { id: 4, name: "GPU Render (A100)", provider: "Render Network", category: "Compute", price: 1.20, minScore: 500, rating: 4.7, latency: "2s" },
  { id: 5, name: "Premium IPFS Pinning", provider: "Pinata", category: "Storage", price: 0.05, minScore: 300, rating: 4.6, latency: "200ms" },
  { id: 6, name: "Whisper v3 Large", provider: "Replicate", category: "API", price: 0.025, minScore: 0, rating: 4.5, latency: "800ms" },
  { id: 7, name: "DALL-E 3 HD", provider: "OpenAI", category: "Creative", price: 0.08, minScore: 600, rating: 4.9, latency: "3s" },
  { id: 8, name: "Stable Video Diffusion", provider: "Replicate", category: "Creative", price: 0.15, minScore: 800, rating: 4.4, latency: "8s" },
];

export default function Marketplace() {
  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const agent = useAgentData();
  const agentScore = agent.score;

  return (
    <div className="min-h-screen max-w-6xl mx-auto px-6 py-12">
      <div className="mb-8 fade-in">
        <h1 className="text-2xl font-bold tracking-tight mb-1.5">Pulse Market</h1>
        <p className="text-text-secondary text-sm">
          {isConnected
            ? `Your Pulse Score: ${agentScore}. ${agent.exists ? "Services unlock as your reputation grows." : "Register your agent to start building reputation."}`
            : "Connect your wallet to see which services you can access."
          }
        </p>
      </div>

      {isConnected && (
        <div className="glass rounded-xl p-4 mb-8 flex items-center gap-4 fade-in" style={{ animationDelay: "0.1s" }}>
          <div className="w-10 h-10 rounded-lg bg-pulse-green/10 flex items-center justify-center text-lg shrink-0">🛡️</div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium">Score Gate System</p>
            <p className="text-[12px] text-text-tertiary mt-0.5">
              Services with higher requirements are locked. Build reputation through successful transactions to unlock them.
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
      )}

      <div className="flex gap-2 mb-6 flex-wrap fade-in" style={{ animationDelay: "0.15s" }}>
        {["All", "API", "Data", "Compute", "Storage", "Creative"].map((cat, i) => (
          <button
            key={cat}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
              i === 0 ? "bg-white/10 text-text-primary" : "text-text-tertiary hover:text-text-secondary hover:bg-white/[0.04]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {SERVICES.map((service, i) => {
          const accessible = isConnected && agent.exists && agentScore >= service.minScore;
          const tierColors: Record<number, string> = { 0: "#636366", 200: "#FF9F0A", 300: "#FF9F0A", 400: "#0A84FF", 500: "#0A84FF", 600: "#30D158", 800: "#BF5AF2" };
          const tierColor = tierColors[service.minScore] || "#636366";

          return (
            <div
              key={service.id}
              className={`glass rounded-xl overflow-hidden transition-all fade-in ${
                accessible ? "hover:border-pulse-green/20 cursor-pointer" : "opacity-60"
              }`}
              style={{ animationDelay: `${0.2 + i * 0.04}s` }}
            >
              <div className="px-4 pt-4 pb-3 flex items-center justify-between">
                <span className="text-[11px] text-text-tertiary uppercase tracking-wider">{service.category}</span>
                {service.minScore > 0 && (
                  <span className="text-[10px] font-medium flex items-center gap-1" style={{ color: tierColor }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: tierColor }} />
                    {service.minScore}+
                  </span>
                )}
              </div>

              <div className="px-4 pb-4">
                <h3 className="text-[14px] font-semibold mb-0.5 leading-tight">{service.name}</h3>
                <p className="text-[12px] text-text-tertiary mb-3">{service.provider}</p>

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
                    <p className="text-[13px] font-medium"><span className="text-accent-orange">★</span> {service.rating}</p>
                  </div>
                </div>

                {!isConnected ? (
                  <button
                    onClick={() => {
                      const injected = connectors.find((c) => c.id === "injected");
                      if (injected) connect({ connector: injected });
                    }}
                    className="w-full py-2 rounded-lg text-[12px] font-semibold bg-white/[0.04] text-text-secondary hover:bg-white/[0.08] transition-all"
                  >
                    Connect Wallet
                  </button>
                ) : (
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
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
