"use client";

import { useState } from "react";
import PulseScoreRing from "@/components/PulseScoreRing";
import LoadingSpinner from "@/components/LoadingSpinner";
import TransactionList from "@/components/TransactionList";
import Toast from "@/components/Toast";
import { useAgentData } from "@/hooks/useAgentData";
import { useAccount, useConnect } from "wagmi";
import { SCORE_TIERS, PULSE_SCORE_ADDRESS, PULSE_SCORE_ABI, kiteTestnet, addKiteNetwork } from "@/lib/web3";
import { useMounted } from "@/hooks/useMounted";
import { useRealChainId } from "@/hooks/useRealChainId";
import { useAAWallet } from "@/hooks/useAAWallet";
import { encodeRegisterAgent } from "@/lib/aa-sdk";

export default function Profile() {
  const mounted = useMounted();
  const { isConnected, address, connector } = useAccount();
  const { connect, connectors } = useConnect();
  const aa = useAAWallet();
  const agent = useAgentData(aa.canonicalAddress as `0x${string}`);
  const realChainId = useRealChainId();
  const isWrongChain = realChainId !== undefined && realChainId !== kiteTestnet.id;
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [addingNetwork, setAddingNetwork] = useState(false);
  const [registering, setRegistering] = useState(false);

  const handleAddNetwork = async () => {
    setAddingNetwork(true);
    try {
      await addKiteNetwork();
      setToast({ message: "Kite Testnet added — switch network in your wallet", type: "success" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setToast({ message: msg.slice(0, 120), type: "error" });
    } finally {
      setAddingNetwork(false);
    }
  };

  const signUserOp = async (userOpHash: string): Promise<string> => {
    if (!address) throw new Error("Wallet not available");
    const provider = (await connector?.getProvider()) as any;
    if (!provider) throw new Error("Wallet provider not available. Try reconnecting your wallet.");
    return provider.request({
      method: "personal_sign",
      params: [userOpHash, address],
    });
  };

  const handleRegister = async () => {
    if (!aa.canonicalAddress) return;
    setRegistering(true);
    try {
      const result = await aa.sendGaslessTx(
        { target: PULSE_SCORE_ADDRESS, callData: encodeRegisterAgent(aa.canonicalAddress) },
        signUserOp
      );
      if (result.status === "success") {
        setToast({ message: "AA wallet registered as agent — gasless UserOp confirmed", type: "success" });
      } else {
        setToast({ message: "Registration UserOp failed — check AA wallet funding", type: "error" });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setToast({ message: msg.slice(0, 120), type: "error" });
    } finally {
      setRegistering(false);
    }
  };

  if (!mounted) {
    return <LoadingSpinner text="INITIALIZING..." />;
  }

  if (!isConnected) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6">
        <div className="text-center max-w-md fade-in">
          <h1 className="text-2xl font-bold tracking-tight mb-3">AUTHENTICATION REQUIRED</h1>
          <p className="text-text-secondary text-sm mb-10">Connect wallet to decrypt agent profile data.</p>
          <button
            onClick={() => {
              const injected = connectors.find((c) => c.id === "injected" || c.id === "metaMask");
              if (injected) connect({ connector: injected });
            }}
            className="neon-btn-primary px-8 py-3 text-sm rounded-sm"
          >
            [ CONNECT WALLET ]
          </button>
        </div>
      </div>
    );
  }

  if (aa.isLoading) {
    return <LoadingSpinner text="COMPUTING AA WALLET..." />;
  }

  if (agent.isLoading) {
    return <LoadingSpinner text="DECRYPTING PROFILE..." />;
  }

  if (!agent.exists) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6">
        <div className="text-center max-w-md fade-in">
          <div className="text-neon-green text-4xl mb-6 font-bold tracking-widest">[ AGENT ]</div>
          <h1 className="text-2xl font-bold tracking-tight mb-3">NO IDENTITY FOUND</h1>
          <p className="text-text-secondary text-sm mb-4">Register your AA wallet onchain to initialize reputation tracking.</p>
          <p className="text-neon-cyan text-xs font-mono mb-2 border border-neon-cyan/20 inline-block px-3 py-1.5 break-all">{aa.canonicalAddress}</p>
          <p className="text-text-tertiary text-[11px] mb-10">This is your deterministic AA wallet address. All operations are gasless.</p>

          <div className="space-y-4">
            {isWrongChain && (
              <div className="border-2 border-danger bg-danger/10 px-5 py-4">
                <p className="text-[13px] text-danger font-bold tracking-wider mb-2">
                  [ WRONG NETWORK ]
                </p>
                <p className="text-[12px] text-text-secondary mb-3">
                  Wallet is on chain <span className="text-danger font-mono font-bold">{realChainId ?? "?"}</span>. Switch to <span className="text-neon-green font-mono font-bold">Kite Testnet (ID: {kiteTestnet.id})</span>.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddNetwork}
                    disabled={addingNetwork}
                    className="px-3 py-1.5 text-[11px] font-bold tracking-wider border border-neon-cyan text-neon-cyan hover:bg-neon-cyan/20 transition-all disabled:opacity-50"
                  >
                    {addingNetwork ? "ADDING..." : "[ + ADD KITE TESTNET ]"}
                  </button>
                </div>
              </div>
            )}
            <button
              onClick={handleRegister}
              disabled={registering || isWrongChain}
              className={`px-8 py-3 text-sm rounded-sm disabled:opacity-40 font-bold tracking-wider transition-all ${
                isWrongChain
                  ? "border border-danger/40 text-danger/60 cursor-not-allowed"
                  : "neon-btn-primary"
              }`}
            >
              {isWrongChain
                ? "[ SWITCH TO KITE TESTNET ]"
                : registering
                  ? "BUNDLING USEROP..."
                  : "[ REGISTER AA WALLET ]"}
            </button>
          </div>
        </div>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  // Honest score attribution based on PulseScore.sol mechanics
  const failedTxns = agent.totalTxns - agent.successTxns;
  const weeksInactive = agent.lastUpdated > 0
    ? Math.max(0, Math.floor((Date.now() / 1000 - agent.lastUpdated) / (7 * 24 * 3600)))
    : 0;
  const successBonus = agent.successTxns * 6; // ~avg +5 to +8 per success
  const failurePenalty = failedTxns * 15;
  const timeDecay = weeksInactive * 1;
  const rawTotal = 200 + successBonus - failurePenalty - timeDecay;

  const scoreAttribution = [
    { label: "BASE_SCORE", value: 200, max: 200, color: "#00ff41", note: "Registration bonus" },
    { label: "SUCCESS_BONUS", value: successBonus, max: Math.max(successBonus, 800), color: "#00d4ff", note: `+~6 pts x ${agent.successTxns} txns` },
    { label: "FAILURE_PENALTY", value: -failurePenalty, max: 0, color: "#ff0055", note: failedTxns > 0 ? `-15 pts x ${failedTxns} txns` : "None" },
    { label: "TIME_DECAY", value: -timeDecay, max: 0, color: "#f0f000", note: weeksInactive > 0 ? `-${timeDecay} pts (${weeksInactive}w inactive)` : "None" },
  ];

  return (
    <div className="min-h-screen" style={{ padding: "72px 32px 48px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        
        {/* Profile Header */}
        <div className="text-center mb-12 fade-in">
          <div className="w-16 h-16 border border-neon-green/30 flex items-center justify-center text-2xl mx-auto mb-5 bg-surface-raised">
            🤖
          </div>
          <h1 className="text-xl font-bold tracking-tight mb-2">AGENT_PROFILE</h1>
          <p className="text-[12px] text-neon-cyan font-mono mb-1 break-all">{aa.canonicalAddress}</p>
          <p className="text-[10px] text-text-tertiary font-mono mb-4">Signer: {address}</p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span
              className="text-[11px] font-bold px-3 py-1 border"
              style={{ borderColor: `${agent.tier.color}40`, color: agent.tier.color, background: `${agent.tier.color}10` }}
            >
              {agent.tier.label.toUpperCase()}
            </span>
            <span className="text-[11px] font-bold px-3 py-1 border border-neon-green/30 text-neon-green bg-neon-green/10">
              [ ✓ onchain VERIFIED ]
            </span>
            <span className="text-[11px] font-bold px-3 py-1 border border-neon-yellow/30 text-neon-yellow bg-neon-yellow/10">
              [ ⚡ GASLESS ]
            </span>
          </div>
        </div>

        {/* Score Ring */}
        <div className="flex justify-center mb-12 fade-in-up" style={{ animationDelay: "0.2s" }}>
          <PulseScoreRing score={agent.score} size={180} />
        </div>

        {/* Score Attribution */}
        <div className="fade-in mb-6" style={{ animationDelay: "0.3s", padding: "24px", background: "rgba(10,10,10,0.85)", border: "1px solid #222" }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-neon-green text-xs font-bold">[</span>
            <span className="text-xs font-bold tracking-widest text-text-secondary">SCORE_ATTRIBUTION</span>
            <span className="text-neon-green text-xs font-bold">]</span>
          </div>
          <p className="text-[11px] text-text-tertiary mb-5">
            Calculated from onchain mechanics. Final score is capped 0–1000.
          </p>
          <div className="space-y-5">
            {scoreAttribution.map((f, i) => {
              const isPositive = f.value >= 0;
              const barMax = Math.max(f.max, Math.abs(f.value));
              const barPct = barMax > 0 ? (Math.abs(f.value) / barMax) * 100 : 0;
              return (
                <div key={f.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] text-text-secondary font-mono">{f.label}</span>
                    <span className="text-[11px] font-mono" style={{ color: isPositive ? "#00ff41" : "#ff0055" }}>
                      {isPositive ? "+" : ""}{f.value}
                    </span>
                  </div>
                  <div className="h-2.5 bg-surface-raised border border-border overflow-hidden">
                    <div
                      className="score-bar-animate"
                      style={
                        {
                          background: f.color,
                          "--target-width": `${Math.min(barPct, 100)}%`,
                          animationDelay: `${0.6 + i * 0.1}s`,
                        } as React.CSSProperties
                      }
                    />
                  </div>
                  <p className="text-[10px] text-text-tertiary mt-1">{f.note}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-5 pt-4 border-t border-border">
            <div className="flex items-center justify-between text-[12px] font-mono">
              <span className="text-text-secondary">RAW_TOTAL</span>
              <span className={rawTotal >= 0 ? "text-neon-green" : "text-danger"}>{rawTotal >= 0 ? "+" : ""}{rawTotal}</span>
            </div>
            <div className="flex items-center justify-between text-[12px] font-mono mt-1">
              <span className="text-text-secondary">CAPPED_SCORE</span>
              <span className="text-neon-cyan font-bold">{agent.score} / 1000</span>
            </div>
          </div>
        </div>

        {/* Tiers */}
        <div className="fade-in mb-6" style={{ animationDelay: "0.5s", padding: "24px", background: "rgba(10,10,10,0.85)", border: "1px solid #222" }}>
          <div className="flex items-center gap-2 mb-5">
            <span className="text-neon-green text-xs font-bold">[</span>
            <span className="text-xs font-bold tracking-widest text-text-secondary">CLEARANCE_TIERS</span>
            <span className="text-neon-green text-xs font-bold">]</span>
          </div>
          <div className="space-y-2">
            {SCORE_TIERS.map((t) => {
              const isCurrent = t.label === agent.tier.label;
              return (
                <div
                  key={t.label}
                  className={`flex items-center gap-3 px-3 py-2.5 ${
                    isCurrent ? "border border-neon-green/30 bg-neon-green/5" : ""
                  }`}
                >
                  <div className="w-2 h-2 shrink-0" style={{ background: t.color }} />
                  <span className="text-[13px] font-bold flex-1 font-mono" style={{ color: isCurrent ? t.color : undefined }}>
                    {t.label.toUpperCase()}
                  </span>
                  <span className="text-[11px] font-mono text-text-tertiary">
                    {t.min}–{t.max}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] text-neon-green border border-neon-green/30 px-2 py-0.5 font-bold">
                      [ YOU ]
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* onchain Record */}
        <div className="fade-in mb-6" style={{ animationDelay: "0.6s", padding: "24px", background: "rgba(10,10,10,0.85)", border: "1px solid #222" }}>
          <div className="flex items-center gap-2 mb-5">
            <span className="text-neon-green text-xs font-bold">[</span>
            <span className="text-xs font-bold tracking-widest text-text-secondary">ON_CHAIN_RECORD</span>
            <span className="text-neon-green text-xs font-bold">]</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Total TX", value: agent.totalTxns.toString() },
              { label: "Success Rate", value: `${agent.successRate}%` },
              { label: "Total Volume", value: `$${agent.totalSpent.toLocaleString()}` },
              { label: "Session Left", value: `$${agent.sessionRemaining.toFixed(0)}` },
            ].map((stat) => (
              <div key={stat.label} className="border border-border p-4 bg-surface-raised">
                <p className="text-[9px] text-text-tertiary uppercase tracking-wider font-bold mb-1">{stat.label}</p>
                <p className="text-[14px] font-bold mt-1 font-mono text-text-primary">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction History */}
        <div className="fade-in" style={{ animationDelay: "0.7s" }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-neon-green text-xs font-bold">[</span>
            <span className="text-xs font-bold tracking-widest text-text-secondary">TX_HISTORY</span>
            <span className="text-neon-green text-xs font-bold">]</span>
          </div>
          <TransactionList transactions={agent.transactions} isLoading={agent.txnsLoading} />
        </div>

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </div>
  );
}
