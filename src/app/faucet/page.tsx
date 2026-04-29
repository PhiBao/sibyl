"use client";

import { useState } from "react";
import { useAccount, useConnect } from "wagmi";
import { kiteTestnet } from "@/lib/web3";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useMounted } from "@/hooks/useMounted";

export default function Faucet() {
  const mounted = useMounted();
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!mounted) {
    return <LoadingSpinner text="INITIALIZING..." />;
  }

  return (
    <div className="min-h-screen" style={{ padding: "72px 32px 48px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        
        {/* Header */}
        <div className="text-center mb-12 fade-in">
          <div className="mb-6 inline-block">
            <div className="border border-neon-green/30 px-4 py-2 text-neon-green text-xs tracking-widest uppercase">
              [ TESTNET RESOURCES ]
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-3">AGENT_FUNDING_STATION</h1>
          <p className="text-text-secondary text-sm max-w-md mx-auto" style={{ lineHeight: "1.7" }}>
            Fund your agent wallet to participate in the Kite agentic economy. 
            You need <span className="text-neon-green font-bold">KITE</span> for gas and <span className="text-neon-cyan font-bold">USDC</span> for x402 service payments.
          </p>
        </div>

        {/* Wallet Address Card */}
        {isConnected && address && (
          <div className="fade-in mb-8" style={{ padding: "20px", background: "rgba(10,10,10,0.85)", border: "1px solid #222" }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-neon-green text-xs font-bold">[</span>
              <span className="text-xs font-bold tracking-widest text-text-secondary">YOUR_AGENT_WALLET</span>
              <span className="text-neon-green text-xs font-bold">]</span>
            </div>
            <div className="flex items-center gap-3">
              <code className="text-[12px] text-neon-green font-mono flex-1 break-all">{address}</code>
              <button
                onClick={copyAddress}
                className="px-3 py-1.5 text-[11px] font-bold tracking-wider border border-neon-green/40 text-neon-green hover:bg-neon-green/20 transition-all shrink-0"
              >
                {copied ? "[ COPIED ]" : "[ COPY ]"}
              </button>
            </div>
          </div>
        )}

        {!isConnected && (
          <div className="text-center mb-10 fade-in">
            <button
              onClick={() => {
                const injected = connectors.find((c) => c.id === "injected" || c.id === "metaMask");
                if (injected) connect({ connector: injected });
              }}
              className="neon-btn-primary px-8 py-3 text-sm rounded-sm"
            >
              [ CONNECT WALLET TO COPY ADDRESS ]
            </button>
          </div>
        )}

        {/* Step 1: Faucet */}
        <div className="fade-in mb-6" style={{ animationDelay: "0.1s", padding: "24px", background: "rgba(10,10,10,0.85)", border: "1px solid #222" }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 border border-neon-green/30 flex items-center justify-center text-neon-green text-sm font-bold bg-surface-raised">1</div>
            <div>
              <h2 className="text-sm font-bold tracking-wider">GET TEST TOKENS FROM FAUCET</h2>
              <p className="text-[11px] text-text-tertiary">KITE for gas + USDC for x402 payments</p>
            </div>
          </div>
          
          <div className="space-y-3 mb-5">
            <div className="flex items-start gap-3">
              <span className="text-neon-green text-xs mt-0.5">{'>'}</span>
              <p className="text-[12px] text-text-secondary">Visit the official Kite Testnet Faucet</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-neon-green text-xs mt-0.5">{'>'}</span>
              <p className="text-[12px] text-text-secondary">Paste your wallet address (copy above)</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-neon-green text-xs mt-0.5">{'>'}</span>
              <p className="text-[12px] text-text-secondary">Receive both KITE (gas) and USDC (payments) in one request</p>
            </div>
          </div>

          <a
            href="https://faucet.gokite.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-2.5 text-[12px] font-bold tracking-wider border border-neon-green/50 text-neon-green hover:bg-neon-green/20 transition-all"
          >
            [ OPEN KITE FAUCET ]
          </a>
        </div>

        {/* Step 2: Bridge (fallback) */}
        <div className="fade-in mb-6" style={{ animationDelay: "0.2s", padding: "24px", background: "rgba(10,10,10,0.85)", border: "1px solid #222" }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 border border-neon-cyan/30 flex items-center justify-center text-neon-cyan text-sm font-bold bg-surface-raised">2</div>
            <div>
              <h2 className="text-sm font-bold tracking-wider">ALTERNATIVE: BRIDGE FROM SEPOLIA</h2>
              <p className="text-[11px] text-text-tertiary">If faucet is empty, bridge from another testnet</p>
            </div>
          </div>

          <div className="space-y-3 mb-5">
            <div className="flex items-start gap-3">
              <span className="text-neon-cyan text-xs mt-0.5">{'>'}</span>
              <p className="text-[12px] text-text-secondary">Get Sepolia ETH from Alchemy/Infura faucet</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-neon-cyan text-xs mt-0.5">{'>'}</span>
              <p className="text-[12px] text-text-secondary">Get Sepolia USDC from a testnet faucet</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-neon-cyan text-xs mt-0.5">{'>'}</span>
              <p className="text-[12px] text-text-secondary">Bridge to Kite Testnet via Kite Bridge (takes 3-4 min)</p>
            </div>
          </div>

          <a
            href="https://bridge.gokite.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-2.5 text-[12px] font-bold tracking-wider border border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/20 transition-all"
          >
            [ OPEN KITE BRIDGE ]
          </a>
        </div>

        {/* Token Contracts */}
        <div className="fade-in" style={{ animationDelay: "0.3s", padding: "24px", background: "rgba(10,10,10,0.85)", border: "1px solid #222" }}>
          <div className="flex items-center gap-2 mb-5">
            <span className="text-neon-green text-xs font-bold">[</span>
            <span className="text-xs font-bold tracking-widest text-text-secondary">TOKEN_CONTRACTS</span>
            <span className="text-neon-green text-xs font-bold">]</span>
          </div>
          <div className="space-y-3">
            {[
              { label: "KITE (Native Gas)", address: "Native token — no contract", explorer: null },
              { label: "USDC (Payment)", address: "0x0fF5393387ad2f9f691FD6Fd28e07E3969e27e63", explorer: "https://testnet.kitescan.ai/token/0x0fF5393387ad2f9f691FD6Fd28e07E3969e27e63" },
              { label: "PulseScore", address: "0x2824a4A5Dfa62E4F956358Fc2e2AE88175F6Af2b", explorer: "https://testnet.kitescan.ai/address/0x2824a4A5Dfa62E4F956358Fc2e2AE88175F6Af2b" },
            ].map((token) => (
              <div key={token.label} className="flex items-center justify-between border border-border p-3 bg-surface-raised">
                <div>
                  <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-bold">{token.label}</p>
                  <p className="text-[11px] text-neon-green font-mono mt-1">{token.address}</p>
                </div>
                {token.explorer && (
                  <a
                    href={token.explorer}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 text-[10px] font-bold tracking-wider border border-border text-text-tertiary hover:text-neon-green hover:border-neon-green/40 transition-all shrink-0"
                  >
                    [ VIEW ]
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Network Info */}
        <div className="fade-in mt-6" style={{ animationDelay: "0.4s", padding: "24px", background: "rgba(10,10,10,0.85)", border: "1px solid #222" }}>
          <div className="flex items-center gap-2 mb-5">
            <span className="text-neon-green text-xs font-bold">[</span>
            <span className="text-xs font-bold tracking-widest text-text-secondary">NETWORK_CONFIG</span>
            <span className="text-neon-green text-xs font-bold">]</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: "Network", value: kiteTestnet.name },
              { label: "Chain ID", value: kiteTestnet.id.toString() },
              { label: "RPC URL", value: "https://rpc-testnet.gokite.ai" },
              { label: "Explorer", value: "https://testnet.kitescan.ai" },
              { label: "Currency", value: kiteTestnet.nativeCurrency.symbol },
              { label: "Decimals", value: kiteTestnet.nativeCurrency.decimals.toString() },
            ].map((item) => (
              <div key={item.label} className="border border-border p-3 bg-surface-raised">
                <p className="text-[9px] text-text-tertiary uppercase tracking-wider font-bold mb-1">{item.label}</p>
                <p className="text-[11px] font-mono text-text-primary">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
