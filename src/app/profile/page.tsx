"use client";

import { useState } from "react";
import PulseScoreRing from "@/components/PulseScoreRing";
import LoadingSpinner from "@/components/LoadingSpinner";
import TransactionList from "@/components/TransactionList";
import Toast from "@/components/Toast";
import { useAgentData } from "@/hooks/useAgentData";
import { useAccount, useConnect, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { SCORE_TIERS, PULSE_SCORE_ADDRESS, PULSE_SCORE_ABI, kiteTestnet, addKiteNetwork } from "@/lib/web3";
import { useMounted } from "@/hooks/useMounted";
import { useRealChainId } from "@/hooks/useRealChainId";

export default function Profile() {
  const mounted = useMounted();
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const agent = useAgentData();
  const realChainId = useRealChainId();
  const isWrongChain = realChainId !== undefined && realChainId !== kiteTestnet.id;
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [addingNetwork, setAddingNetwork] = useState(false);

  const { writeContract, data: txHash, isPending: isRegistering } = useWriteContract({
    mutation: {
      onError: (err) => {
        setToast({ message: err.message.slice(0, 120), type: "error" });
      },
      onSuccess: () => {
        setToast({ message: "Registration submitted — awaiting confirmation", type: "success" });
      },
    },
  });
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

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

  const handleRegister = () => {
    if (!address) return;
    writeContract({
      address: PULSE_SCORE_ADDRESS,
      abi: PULSE_SCORE_ABI,
      functionName: "registerAgent",
      args: [address],
    });
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

  if (agent.isLoading) {
    return <LoadingSpinner text="DECRYPTING PROFILE..." />;
  }

  if (!agent.exists) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6">
        <div className="text-center max-w-md fade-in">
          <div className="text-neon-green text-4xl mb-6 font-bold tracking-widest">[ AGENT ]</div>
          <h1 className="text-2xl font-bold tracking-tight mb-3">NO IDENTITY FOUND</h1>
          <p className="text-text-secondary text-sm mb-4">Register on-chain to initialize reputation tracking.</p>
          <p className="text-neon-green text-xs font-mono mb-10 border border-neon-green/20 inline-block px-3 py-1.5">{address}</p>
          {isConfirmed ? (
            <div className="space-y-5">
              <div className="text-neon-green text-sm font-bold border border-neon-green/30 inline-block px-4 py-2">
                [ ✓ IDENTITY CREATED ]
              </div>
              <div>
                <button
                  onClick={() => window.location.reload()}
                  className="neon-btn-primary px-6 py-2.5 text-sm rounded-sm"
                >
                  [ LOAD PROFILE ]
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {isWrongChain && (
                <div className="border-2 border-danger bg-danger/10 px-5 py-4">
                  <p className="text-[13px] text-danger font-bold tracking-wider mb-2">
                    [ WRONG NETWORK ]
                  </p>
                  <p className="text-[12px] text-text-secondary mb-3">
                     Wallet is on chain <span className="text-danger font-mono font-bold">{realChainId ?? "?"}</span>. Switch to <span className="text-neon-green font-mono font-bold">Kite Testnet (ID: {kiteTestnet.id})</span> in your wallet to register.
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
                disabled={isRegistering || isConfirming || isWrongChain}
                className={`px-8 py-3 text-sm rounded-sm disabled:opacity-40 font-bold tracking-wider transition-all ${
                  isWrongChain
                    ? "border border-danger/40 text-danger/60 cursor-not-allowed"
                    : "neon-btn-primary"
                }`}
              >
                {isWrongChain
                  ? "[ SWITCH TO KITE TESTNET ]"
                  : isRegistering
                    ? "AWAITING SIGNATURE..."
                    : isConfirming
                      ? "BROADCASTING..."
                      : "[ REGISTER AGENT ]"}
              </button>
            </div>
          )}
        </div>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  const scoreBreakdown = [
    { label: "TX_SUCCESS", value: Math.min(Math.round(agent.score * 0.43), 400), max: 400, color: "#00ff41" },
    { label: "PAYMENT_RELIABILITY", value: Math.min(Math.round(agent.score * 0.28), 250), max: 250, color: "#00d4ff" },
    { label: "SERVICE_RATINGS", value: Math.min(Math.round(agent.score * 0.19), 200), max: 200, color: "#ff0055" },
    { label: "TIME_WEIGHTED", value: Math.min(Math.round(agent.score * 0.10), 150), max: 150, color: "#f0f000" },
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
          <p className="text-[12px] text-neon-green font-mono mb-4 break-all">{address}</p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span
              className="text-[11px] font-bold px-3 py-1 border"
              style={{ borderColor: `${agent.tier.color}40`, color: agent.tier.color, background: `${agent.tier.color}10` }}
            >
              {agent.tier.label.toUpperCase()}
            </span>
            <span className="text-[11px] font-bold px-3 py-1 border border-neon-green/30 text-neon-green bg-neon-green/10">
              [ ✓ ON-CHAIN VERIFIED ]
            </span>
          </div>
        </div>

        {/* Score Ring */}
        <div className="flex justify-center mb-12 fade-in-up" style={{ animationDelay: "0.2s" }}>
          <PulseScoreRing score={agent.score} size={180} />
        </div>

        {/* Score Breakdown */}
        <div className="fade-in mb-6" style={{ animationDelay: "0.3s", padding: "24px", background: "rgba(10,10,10,0.85)", border: "1px solid #222" }}>
          <div className="flex items-center gap-2 mb-6">
            <span className="text-neon-green text-xs font-bold">[</span>
            <span className="text-xs font-bold tracking-widest text-text-secondary">SCORE_BREAKDOWN</span>
            <span className="text-neon-green text-xs font-bold">]</span>
          </div>
          <div className="space-y-5">
            {scoreBreakdown.map((f, i) => (
              <div key={f.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] text-text-secondary font-mono">{f.label}</span>
                  <span className="text-[11px] font-mono text-text-tertiary">
                    {f.value}/{f.max}
                  </span>
                </div>
                <div className="h-2.5 bg-surface-raised border border-border overflow-hidden">
                  <div
                    className="score-bar-animate"
                    style={
                      {
                        background: f.color,
                        "--target-width": `${Math.min((f.value / f.max) * 100, 100)}%`,
                        animationDelay: `${0.6 + i * 0.1}s`,
                      } as React.CSSProperties
                    }
                  />
                </div>
              </div>
            ))}
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

        {/* On-Chain Record */}
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
