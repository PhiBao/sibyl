"use client";

import { useState, useEffect } from "react";
import { useAgentData } from "@/hooks/useAgentData";
import { useAccount, useConnect } from "wagmi";
import { useAAWallet } from "@/hooks/useAAWallet";
import { getPublicClient } from "wagmi/actions";
import PurchaseModal from "@/components/PurchaseModal";
import RegisterServiceModal from "@/components/RegisterServiceModal";
import LoadingSpinner from "@/components/LoadingSpinner";
import Toast from "@/components/Toast";
import { useMounted } from "@/hooks/useMounted";
import { PULSE_SCORE_ADDRESS, PULSE_SCORE_ABI, USDC_DECIMALS, config } from "@/lib/web3";

const USDCD = 10 ** USDC_DECIMALS;

interface OnChainService {
  id: number;
  provider: string;
  name: string;
  description: string;
  endpoint: string;
  price: number;
  minScore: number;
  exists: boolean;
  totalCalls: number;
  successfulCalls: number;
  totalRevenue: number;
  averageRating: number;
  category: string;
}

const CATEGORY_KEYWORDS: { keywords: string[]; category: string }[] = [
  { keywords: ["gpt", "llm", "claude", "text", "language", "inference"], category: "LLM" },
  { keywords: ["price", "feed", "oracle", "data", "market"], category: "Data" },
  { keywords: ["gpu", "render", "compute", "training", "inference"], category: "Compute" },
  { keywords: ["ipfs", "storage", "pin", "archive", "host"], category: "Storage" },
  { keywords: ["whisper", "audio", "speech", "voice", "sound"], category: "Audio" },
  { keywords: ["dall", "image", "diffusion", "picture", "photo"], category: "Image" },
  { keywords: ["video", "animation", "motion"], category: "Video" },
];

function inferCategory(name: string): string {
  const lower = name.toLowerCase();
  for (const { keywords, category } of CATEGORY_KEYWORDS) {
    if (keywords.some((k) => lower.includes(k))) return category;
  }
  return "Other";
}

export default function ServiceRegistry() {
  const mounted = useMounted();
  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const aa = useAAWallet();
  const agent = useAgentData(aa.canonicalAddress as `0x${string}`);
  const agentScore = agent.score;

  const [services, setServices] = useState<OnChainService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState<OnChainService | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const reloadServices = async () => {
    setServicesLoading(true);
    try {
      const publicClient = getPublicClient(config);
      if (!publicClient) { setServicesLoading(false); return; }
      const count = await publicClient.readContract({
        address: PULSE_SCORE_ADDRESS,
        abi: PULSE_SCORE_ABI,
        functionName: "getServiceCount",
      });
      const total = Number(count);
      if (total === 0) { setServices([]); setServicesLoading(false); return; }
      const loaded: OnChainService[] = [];
      for (let i = 1; i <= total; i++) {
        try {
          const [svc, rating] = await Promise.all([
            publicClient.readContract({
              address: PULSE_SCORE_ADDRESS,
              abi: PULSE_SCORE_ABI,
              functionName: "getService",
              args: [BigInt(i)],
            }),
            publicClient.readContract({
              address: PULSE_SCORE_ADDRESS,
              abi: PULSE_SCORE_ABI,
              functionName: "getServiceAverageRating",
              args: [BigInt(i)],
            }).catch(() => BigInt(0)),
          ]);
          if (!svc.exists) continue;
          loaded.push({
            id: i,
            provider: svc.provider,
            name: svc.name,
            description: svc.description,
            endpoint: svc.endpoint,
            price: Number(svc.price) / USDCD,
            minScore: Number(svc.minScore),
            exists: true,
            totalCalls: Number(svc.totalCalls),
            successfulCalls: Number(svc.successfulCalls),
            totalRevenue: Number(svc.totalRevenue) / USDCD,
            averageRating: Number(rating) / 100,
            category: inferCategory(svc.name),
          });
        } catch {
          // Skip failed reads
        }
      }
      setServices(loaded);
    } catch {
      // Ignore
    } finally {
      setServicesLoading(false);
    }
  };

  useEffect(() => {
    async function loadServices() {
      try {
        const publicClient = getPublicClient(config);
        if (!publicClient) { setServicesLoading(false); return; }

        // Read service count
        const count = await publicClient.readContract({
          address: PULSE_SCORE_ADDRESS,
          abi: PULSE_SCORE_ABI,
          functionName: "getServiceCount",
        });

        const total = Number(count);
        if (total === 0) { setServicesLoading(false); return; }

        const loaded: OnChainService[] = [];
        for (let i = 1; i <= total; i++) {
          try {
            const [svc, rating] = await Promise.all([
              publicClient.readContract({
                address: PULSE_SCORE_ADDRESS,
                abi: PULSE_SCORE_ABI,
                functionName: "getService",
                args: [BigInt(i)],
              }),
              publicClient.readContract({
                address: PULSE_SCORE_ADDRESS,
                abi: PULSE_SCORE_ABI,
                functionName: "getServiceAverageRating",
                args: [BigInt(i)],
              }).catch(() => BigInt(0)),
            ]);
            if (!svc.exists) continue;
            loaded.push({
              id: i,
              provider: svc.provider,
              name: svc.name,
              description: svc.description,
              endpoint: svc.endpoint,
              price: Number(svc.price) / USDCD,
              minScore: Number(svc.minScore),
              exists: true,
              totalCalls: Number(svc.totalCalls),
              successfulCalls: Number(svc.successfulCalls),
              totalRevenue: Number(svc.totalRevenue) / USDCD,
              averageRating: Number(rating) / 100,
            category: inferCategory(svc.name),
            });
          } catch {
            // Skip failed reads
          }
        }
        setServices(loaded);
      } catch {
        // Ignore
      } finally {
        setServicesLoading(false);
      }
    }
    loadServices();
  }, []);

  const allCategories = ["All", ...Array.from(new Set(services.map((s) => inferCategory(s.name))))];

  const filteredServices = services.filter((service) => {
    const matchesCategory = activeCategory === "All" || inferCategory(service.name) === activeCategory;
    const matchesSearch =
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.provider.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (!mounted) {
    return <LoadingSpinner text="INITIALIZING..." />;
  }

  if (isConnected && agent.isLoading) {
    return <LoadingSpinner text="LOADING SERVICE REGISTRY..." />;
  }

  return (
    <div className="min-h-screen" style={{ padding: "72px 32px 48px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Page Title */}
        <div style={{ marginBottom: "40px" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-neon-green text-xs font-bold">[</span>
              <span className="text-xs font-bold tracking-widest text-text-secondary">AGENT_SERVICE_REGISTRY</span>
              <span className="text-neon-green text-xs font-bold">]</span>
            </div>
            {isConnected && agent.exists && (
              <button
                onClick={() => setShowRegisterModal(true)}
                className="px-4 py-2 text-[11px] font-bold tracking-wider border border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/10 transition-all"
              >
                [ + REGISTER SERVICE ]
              </button>
            )}
          </div>
          <p className="text-text-secondary text-sm" style={{ lineHeight: "1.7" }}>
            {isConnected
              ? `PULSE_SCORE: ${agentScore} // ${agent.exists ? "Discover verified agent services. Reputation gates access." : "Register agent to enable x402 service discovery."}`
              : "Authentication required. Connect wallet to discover agent services."}
          </p>
        </div>

        {/* x402 Info */}
        {isConnected && (
          <div 
            className="fade-in"
            style={{ 
              marginBottom: "40px",
              padding: "24px",
              background: "rgba(10,10,10,0.85)",
              border: "1px solid #222",
              display: "flex",
              alignItems: "center",
              gap: "20px"
            }}
          >
            <div style={{ width: "48px", height: "48px", border: "1px solid rgba(0,255,65,0.3)", display: "flex", alignItems: "center", justifyContent: "center", background: "#111", flexShrink: 0, fontSize: "20px" }}>
              🌐
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="text-sm font-bold text-text-primary tracking-wide" style={{ marginBottom: "6px" }}>X402_PAYMENT_PROTOCOL</p>
              <p className="text-xs text-text-secondary" style={{ lineHeight: "1.6" }}>
                Agent-to-agent micropayments via HTTP 402. Services return payment terms → agent authorizes → facilitator settles onchain. Session budget: ${agent.sessionRemaining.toFixed(2)} USDC.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-4" style={{ flexShrink: 0 }}>
              {["Unverified", "Newcomer", "Trusted", "Reliable", "Elite"].map((t, i) => {
                const colors = ["#888", "#f0f000", "#00d4ff", "#00ff41", "#ff0055"];
                return (
                  <div key={t} className="flex items-center gap-1.5">
                    <span className="text-[10px] text-text-tertiary uppercase">{t}</span>
                    <span style={{ width: "8px", height: "8px", background: colors[i], display: "inline-block" }} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Search + Filters */}
        <div className="fade-in" style={{ marginBottom: "40px" }}>
          <div style={{ position: "relative", maxWidth: "500px", marginBottom: "16px" }}>
            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#666", fontSize: "12px" }}>{`>`}</span>
            <input
              type="text"
              placeholder="SEARCH_SERVICES..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px 12px 32px",
                background: "#0a0a0a",
                border: "1px solid #222",
                color: "#e8e8e8",
                fontSize: "13px",
                fontFamily: "inherit",
                outline: "none"
              }}
              className="focus:border-neon-green/50"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {allCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 border text-[11px] font-bold tracking-wider transition-all ${
                  activeCategory === cat
                    ? "border-neon-green/50 bg-neon-green/10 text-neon-green"
                    : "border-border text-text-tertiary hover:text-text-secondary hover:border-text-tertiary"
                }`}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {servicesLoading && (
          <div className="text-center fade-in" style={{ padding: "64px", background: "rgba(10,10,10,0.85)", border: "1px solid #222" }}>
            <p className="text-neon-green text-xl mb-4 font-bold">[ SYNCING ]</p>
            <p className="text-text-secondary text-sm">Loading services from Kite Testnet...</p>
          </div>
        )}

        {/* No Results */}
        {!servicesLoading && filteredServices.length === 0 && (
          <div className="text-center fade-in" style={{ padding: "64px", background: "rgba(10,10,10,0.85)", border: "1px solid #222" }}>
            <p className="text-neon-green text-xl mb-4 font-bold">[ NO MATCH ]</p>
            <p className="text-text-secondary text-sm">No agent services match search parameters.</p>
          </div>
        )}

        {/* Cards Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
          {filteredServices.map((service, i) => {
            const accessible = isConnected && agent.exists && agentScore >= service.minScore;
            const tierColors: Record<number, string> = {
              0: "#888", 200: "#f0f000", 300: "#f0f000",
              400: "#00d4ff", 500: "#00d4ff",
              600: "#00ff41", 800: "#ff0055",
            };
            const tierColor = tierColors[service.minScore] || "#888";
            return (
              <div
                key={service.id}
                className="fade-in"
                style={{ 
                  animationDelay: `${0.2 + i * 0.04}s`,
                  background: "rgba(10,10,10,0.85)",
                  border: accessible ? "1px solid #333" : "1px solid #222",
                  overflow: "hidden",
                  cursor: accessible ? "pointer" : "default",
                  opacity: accessible ? 1 : 0.5,
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => { if (accessible) e.currentTarget.style.borderColor = "rgba(0,255,65,0.3)"; }}
                onMouseLeave={(e) => { if (accessible) e.currentTarget.style.borderColor = "#333"; }}
                onClick={() => accessible && setSelectedService(service)}
              >
                {/* Card Header */}
                <div style={{ padding: "16px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #222", background: "#111" }}>
                  <span className="text-[10px] text-text-tertiary uppercase tracking-widest font-bold">{service.category}</span>
                  {service.minScore > 0 && (
                    <span className="text-[10px] font-bold flex items-center gap-1.5" style={{ color: tierColor }}>
                      <span style={{ width: "6px", height: "6px", background: tierColor, display: "inline-block" }} />
                      {service.minScore}+
                    </span>
                  )}
                </div>

                {/* Card Body */}
                <div style={{ padding: "20px" }}>
                  <h3 className="text-[15px] font-bold mb-1" style={{ color: "#e8e8e8" }}>{service.name}</h3>
                  <p className="text-[11px] text-text-secondary mb-2 font-mono">{`>`} {service.provider.slice(0, 10)}...{service.provider.slice(-8)}</p>
                  <p className="text-[10px] text-text-tertiary mb-3 font-mono truncate">{service.endpoint}</p>
                  {service.averageRating > 0 && (
                    <div className="flex items-center gap-1.5 mb-4">
                      <span className="text-neon-yellow text-[11px]">
                        {"★".repeat(Math.round(service.averageRating))}
                        {"☆".repeat(5 - Math.round(service.averageRating))}
                      </span>
                      <span className="text-[10px] text-text-tertiary font-mono">{service.averageRating.toFixed(1)}/5</span>
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
                    <div>
                      <p className="text-[9px] text-text-tertiary uppercase tracking-wider font-bold mb-1">Price/call</p>
                      <p className="text-[15px] font-bold font-mono text-neon-cyan">${service.price.toFixed(3)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-text-tertiary uppercase tracking-wider font-bold mb-1">Calls</p>
                      <p className="text-[13px] font-mono text-text-primary">{service.totalCalls}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-text-tertiary uppercase tracking-wider font-bold mb-1">Protocol</p>
                      <p className="text-[13px] font-mono text-neon-green">x402</p>
                    </div>
                  </div>

                  {!isConnected ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const injected = connectors.find((c) => c.id === "injected" || c.id === "metaMask");
                        if (injected) connect({ connector: injected });
                      }}
                      className="w-full py-3 text-[11px] font-bold tracking-wider border border-border text-text-secondary hover:text-neon-green hover:border-neon-green/40 transition-all"
                    >
                      [ CONNECT ]
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (accessible) setSelectedService(service);
                      }}
                      className={`w-full py-3 text-[11px] font-bold tracking-wider border transition-all ${
                        accessible
                          ? "border-neon-green/50 bg-neon-green/10 text-neon-green hover:bg-neon-green/20"
                          : "border-border text-text-tertiary cursor-not-allowed"
                      }`}
                      disabled={!accessible}
                    >
                      {accessible ? "[ REQUEST SERVICE ]" : `[ LOCKED // ${service.minScore}+ ]`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {selectedService && (
          <PurchaseModal
            service={selectedService}
            onClose={() => setSelectedService(null)}
            onSuccess={() => setToast({ message: "x402 settlement recorded. Refresh to sync.", type: "success" })}
          />
        )}

        {showRegisterModal && (
          <RegisterServiceModal
            onClose={() => setShowRegisterModal(false)}
            onSuccess={() => {
              setShowRegisterModal(false);
              setToast({ message: "Service registered onchain. Refreshing registry...", type: "success" });
              reloadServices();
            }}
          />
        )}

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </div>
  );
}
