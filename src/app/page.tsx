"use client";

import { useState } from "react";
import { useAccount, useConnect } from "wagmi";
import { PULSE_SCORE_ADDRESS, PULSE_SCORE_ABI, kiteTestnet, addKiteNetwork } from "@/lib/web3";
import PulseScoreRing from "@/components/PulseScoreRing";
import StatCard from "@/components/StatCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import TransactionList from "@/components/TransactionList";
import Toast from "@/components/Toast";
import { useAgentData } from "@/hooks/useAgentData";
import { useMounted } from "@/hooks/useMounted";
import { useRealChainId } from "@/hooks/useRealChainId";
import { useAAWallet } from "@/hooks/useAAWallet";
import { encodeRegisterAgent } from "@/lib/aa-sdk";

export default function Dashboard() {
  const mounted = useMounted();
  const { isConnected, address, connector } = useAccount();
  const { connect, connectors } = useConnect();
  const aa = useAAWallet();
  const agent = useAgentData(aa.canonicalAddress as `0x${string}`);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [addingNetwork, setAddingNetwork] = useState(false);
  const [registering, setRegistering] = useState(false);
  const realChainId = useRealChainId();
  const isWrongChain = realChainId !== undefined && realChainId !== kiteTestnet.id;

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
      <>
        <div className="min-h-[80vh] flex items-center justify-center px-6">
          <div className="text-center max-w-lg fade-in">
            <div className="mb-8 inline-block">
              <div className="border border-neon-green/30 px-4 py-2 text-neon-green text-xs tracking-widest uppercase">
                [ SYSTEM READY ]
              </div>
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-4 text-text-primary">
              INITIALIZE CONNECTION
            </h1>
            <p className="text-text-secondary text-sm mb-10 max-w-sm mx-auto" style={{ lineHeight: "1.7" }}>
              Link your wallet to access the Pulse reputation layer.
              All agent data is verified on-chain via Kite Chain protocol.
            </p>
            <button
              onClick={() => setShowConnectModal(true)}
              className="neon-btn-primary px-8 py-3 text-sm rounded-sm"
            >
              [ CONNECT WALLET ]
            </button>
            <p className="text-text-tertiary text-xs mt-8 font-mono">
              {`>`} NEW_AGENT? REGISTER_POST_AUTH
            </p>
          </div>
        </div>

        {showConnectModal && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center px-4 py-10 overflow-y-auto">
            <div className="absolute inset-0 bg-black/90" onClick={() => setShowConnectModal(false)} />
            <div className="relative w-full max-w-md fade-in mx-4" style={{ background: "rgba(10,10,10,0.95)", border: "1px solid rgba(0,255,65,0.4)", boxShadow: "0 0 12px rgba(0,255,65,0.08)" }}>
              <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-surface-raised">
                <div>
                  <h3 className="text-sm font-bold tracking-wider text-neon-green">[ CONNECT_WALLET ]</h3>
                  <p className="text-[11px] text-text-tertiary mt-0.5">Select interface module</p>
                </div>
                <button
                  onClick={() => setShowConnectModal(false)}
                  className="w-7 h-7 flex items-center justify-center border border-border text-text-tertiary hover:text-neon-green hover:border-neon-green/40 transition-all"
                >
                  ✕
                </button>
              </div>
              <div className="p-4 space-y-2">
                {connectors.map((connector) => {
                  const icons: Record<string, string> = {
                    metaMaskSDK: "🦊", metaMask: "🦊", walletConnect: "🔗",
                    coinbaseWalletSDK: "🔵", coinbaseWallet: "🔵", injected: "🌐",
                  };
                  return (
                    <button
                      key={connector.id}
                      onClick={() => { connect({ connector }); setShowConnectModal(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 border border-border bg-surface hover:border-neon-green/40 hover:bg-surface-raised transition-all group text-left"
                    >
                      <div className="w-9 h-9 border border-border flex items-center justify-center text-[16px] group-hover:border-neon-green/30">
                        {icons[connector.id] || "👛"}
                      </div>
                      <div className="flex-1">
                        <div className="text-[13px] font-semibold text-text-primary group-hover:text-neon-green transition-colors">
                          {connector.name.toUpperCase()}
                        </div>
                        <div className="text-[11px] text-text-tertiary">
                          {connector.id.includes("metaMask") ? "Browser extension"
                            : connector.id.includes("walletConnect") ? "QR scan protocol"
                              : connector.id.includes("coinbase") ? "Coinbase interface"
                                : "Injected provider"}
                        </div>
                      </div>
                      <div className="text-text-tertiary text-xs group-hover:text-neon-green">{`>>`}</div>
                    </button>
                  );
                })}
              </div>
              <div className="px-4 py-3 border-t border-border bg-surface-raised text-center">
                <p className="text-[11px] text-text-tertiary">
                  No interface detected?{" "}
                  <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" className="text-neon-green hover:underline">
                    [ INSTALL METAMASK ]
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  if (aa.isLoading) {
    return <LoadingSpinner text="COMPUTING AA WALLET..." />;
  }

  if (agent.isLoading) {
    return <LoadingSpinner text="FETCHING AGENT DATA..." />;
  }

  if (!agent.exists) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6">
        <div className="text-center max-w-lg fade-in">
          <div className="text-neon-green text-4xl mb-6 font-bold tracking-widest">[ AGENT ]</div>
          <h1 className="text-2xl font-bold tracking-tight mb-3">AGENT REGISTRATION REQUIRED</h1>
          <p className="text-text-secondary text-sm mb-4">Wallet authenticated. No on-chain identity found.</p>
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
          <p className="text-text-tertiary text-xs mt-8">
            {`>`} Creates immutable on-chain attestation. Initial score: 200. No KITE gas required.
          </p>
        </div>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ padding: "72px 32px 48px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Status Bar */}
        <div className="flex justify-center mb-10 fade-in">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 border border-neon-green/30 text-[11px] text-neon-green tracking-widest uppercase">
            <span className="w-1.5 h-1.5 bg-neon-green animate-pulse" />
            LIVE :: KITE_TESTNET :: {agent.agentCount} AGENTS
          </div>
        </div>

        {/* Score Ring */}
        <div className="flex flex-col items-center mb-12 fade-in-up" style={{ animationDelay: "0.1s" }}>
          <PulseScoreRing score={agent.score} size={220} strokeWidth={10} />
          <div className="mt-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight mb-2">PULSE_REPUTATION_SCORE</h1>
            <p className="text-text-secondary text-sm">Verified on-chain transaction history</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-14">
          <StatCard label="SUCCESS_RATE" value={`${agent.successRate}%`} icon="✓" delay={0.2} />
          <StatCard label="X402_CALLS" value={agent.totalTxns.toString()} icon="⚡" delay={0.3} />
          <StatCard label="TOTAL_SPENT" value={`$${agent.totalSpent.toLocaleString()}`} icon="💰" delay={0.4} />
          <StatCard label="SESSION_LEFT" value={`$${agent.sessionRemaining.toFixed(0)}`} icon="🔋" delay={0.5} />
        </div>

        {/* Agent Identity */}
        <div className="fade-in mb-14" style={{ animationDelay: "0.6s", padding: "24px", background: "rgba(10,10,10,0.85)", border: "1px solid #222" }}>
          <div className="flex items-center gap-2 mb-5">
            <span className="text-neon-green text-xs font-bold">[</span>
            <span className="text-xs font-bold tracking-widest text-text-secondary">AGENT_IDENTITY</span>
            <span className="text-neon-green text-xs font-bold">]</span>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-10 h-10 border border-neon-green/30 flex items-center justify-center text-lg shrink-0 bg-surface-raised">
              🤖
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-text-primary">AGENT_NODE</p>
              <p className="text-[11px] text-neon-cyan font-mono truncate">{aa.canonicalAddress}</p>
              <p className="text-[10px] text-text-tertiary font-mono">Signer: {address}</p>
            </div>
            <div className="flex items-center gap-6 sm:ml-auto">
              <div>
                <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">Active Since</p>
                <p className="text-xs font-mono text-text-primary">{agent.registeredAt || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">Network</p>
                <p className="text-xs font-mono text-text-primary">KITE_TESTNET</p>
              </div>
              <div>
                <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-1">Tier</p>
                <p className="text-xs font-mono font-bold" style={{ color: agent.tier.color }}>
                  {agent.tier.label.toUpperCase()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* MCP Integration */}
        <div className="fade-in mb-14" style={{ animationDelay: "0.7s", padding: "24px", background: "rgba(10,10,10,0.85)", border: "1px solid #222" }}>
          <div className="flex items-center gap-2 mb-5">
            <span className="text-neon-green text-xs font-bold">[</span>
            <span className="text-xs font-bold tracking-widest text-text-secondary">AI_AGENT_INTEGRATION</span>
            <span className="text-neon-green text-xs font-bold">]</span>
          </div>
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div style={{ width: "48px", height: "48px", border: "1px solid rgba(0,212,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", background: "#111", flexShrink: 0, fontSize: "20px" }}>
              🤖
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="text-sm font-bold text-text-primary tracking-wide" style={{ marginBottom: "6px" }}>MODEL_CONTEXT_PROTOCOL</p>
              <p className="text-xs text-text-secondary" style={{ lineHeight: "1.6" }}>
                Expose Sibyl reputation and services as AI-callable tools. Any AI agent can query 
                your score, discover services, and evaluate reputation gates via the MCP endpoint.
              </p>
            </div>
            <a
              href="/mcp"
              className="shrink-0 px-4 py-2 text-[11px] font-bold tracking-wider border border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/10 transition-all"
            >
              [ VIEW DOCS ]
            </a>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="fade-in pb-12" style={{ animationDelay: "0.8s" }}>
          <div className="flex items-center gap-2 mb-5">
            <span className="text-neon-green text-xs font-bold">[</span>
            <span className="text-xs font-bold tracking-widest text-text-secondary">RECENT_ACTIVITY</span>
            <span className="text-neon-green text-xs font-bold">]</span>
          </div>
          <TransactionList transactions={agent.transactions} isLoading={agent.txnsLoading} />
        </div>

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </div>
  );
}
