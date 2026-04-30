"use client";

import { useAAWallet } from "@/hooks/useAAWallet";
import { useAccount } from "wagmi";
import { useState } from "react";

export default function AAWalletPanel() {
  const { isConnected } = useAccount();
  const { aaAddress, isLoading, lastTxStatus, lastTxHash, lastTxError, lastTxMode, lastEstimationFailed } = useAAWallet();
  const [copied, setCopied] = useState(false);

  if (!isConnected) return null;
  if (isLoading) {
    return (
      <div className="fade-in mb-6" style={{ padding: "16px 20px", background: "rgba(10,10,10,0.85)", border: "1px solid #222" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border border-neon-green/30 flex items-center justify-center bg-surface-raised">
            <div className="w-3 h-3 border-2 border-neon-green/30 border-t-neon-green rounded-full animate-spin" />
          </div>
          <p className="text-[11px] text-text-tertiary font-mono">Computing AA wallet address...</p>
        </div>
      </div>
    );
  }
  if (!aaAddress) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(aaAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore
    }
  };

  return (
    <div className="fade-in mb-6" style={{ padding: "16px 20px", background: "rgba(10,10,10,0.85)", border: "1px solid #222" }}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div style={{ width: "36px", height: "36px", border: "1px solid rgba(0,255,65,0.3)", display: "flex", alignItems: "center", justifyContent: "center", background: "#111" }}>
            <span className="text-neon-green text-lg">⚡</span>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-bold">AA Wallet (Agent Identity)</p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-[11px] font-mono text-neon-cyan break-all">{aaAddress}</p>
              <button
                onClick={handleCopy}
                className="text-[10px] px-1.5 py-0.5 border border-border text-text-tertiary hover:text-text-secondary hover:border-text-tertiary transition-colors shrink-0"
                title="Copy address"
              >
                {copied ? "COPIED" : "COPY"}
              </button>
              <a
                href={`https://testnet.kitescan.ai/address/${aaAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] px-1.5 py-0.5 border border-border text-text-tertiary hover:text-neon-cyan hover:border-neon-cyan transition-colors shrink-0"
              >
                VIEW
              </a>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {lastTxStatus === "pending" && (
            <span className="text-[11px] text-neon-yellow font-mono animate-pulse">[ BUNDLING... ]</span>
          )}
          {lastTxStatus === "success" && lastTxHash && (
            <a
              href={`https://testnet.kitescan.ai/tx/${lastTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-neon-green font-mono hover:underline"
              title={lastTxMode === "sponsored" ? "Gas sponsored by paymaster" : "Gas paid in USDC"}
            >
              [ TX CONFIRMED{lastTxMode === "sponsored" ? " ★" : ""}{lastEstimationFailed ? " ⚠" : ""} ]
            </a>
          )}
          {lastTxStatus === "error" && lastTxError && (
            <span className="text-[11px] text-neon-red font-mono" title={lastTxError}>
              [ FAILED ]
            </span>
          )}

          <span className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold tracking-wider border border-neon-green/50 bg-neon-green/10 text-neon-green">
            <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
            GASLESS ACTIVE
          </span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border space-y-1">
        <p className="text-[10px] text-text-tertiary leading-relaxed">
          All transactions are sent as ERC-4337 UserOperations via the Kite bundler.
          {lastTxMode === "sponsored"
            ? " Sponsored: gas is fully subsidized by the paymaster."
            : " Token payment: gas is paid in USDC from the AA wallet balance (approve calls auto-included)."}
        </p>
        {lastEstimationFailed && (
          <p className="text-[10px] text-neon-yellow leading-relaxed">
            ⚠ Gas estimation failed (paymaster may be underfunded). Transaction used hardcoded gas limits. If it reverted, fund your AA wallet with KITE or USDC and retry.
          </p>
        )}
      </div>
    </div>
  );
}
