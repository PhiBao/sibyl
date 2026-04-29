"use client";

import { useAAWallet } from "@/hooks/useAAWallet";
import { useAccount } from "wagmi";

export default function AAWalletPanel() {
  const { isConnected } = useAccount();
  const { aaAddress, gaslessEnabled, toggleGasless, lastTxStatus, lastTxHash, lastTxError } = useAAWallet();

  if (!isConnected || !aaAddress) return null;

  return (
    <div className="fade-in mb-6" style={{ padding: "16px 20px", background: "rgba(10,10,10,0.85)", border: "1px solid #222" }}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div style={{ width: "36px", height: "36px", border: "1px solid rgba(0,255,65,0.3)", display: "flex", alignItems: "center", justifyContent: "center", background: "#111" }}>
            <span className="text-neon-green text-lg">⚡</span>
          </div>
          <div>
            <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-bold">AA Wallet (ERC-4337)</p>
            <p className="text-[12px] font-mono text-neon-cyan">{aaAddress.slice(0, 10)}...{aaAddress.slice(-8)}</p>
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
            >
              [ TX CONFIRMED ]
            </a>
          )}
          {lastTxStatus === "error" && lastTxError && (
            <span className="text-[11px] text-neon-red font-mono" title={lastTxError}>
              [ FAILED ]
            </span>
          )}

          <button
            onClick={toggleGasless}
            className={`flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold tracking-wider border transition-all ${
              gaslessEnabled
                ? "border-neon-green/50 bg-neon-green/10 text-neon-green"
                : "border-border text-text-tertiary hover:text-text-secondary hover:border-text-tertiary"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${gaslessEnabled ? "bg-neon-green animate-pulse" : "bg-text-tertiary"}`} />
            {gaslessEnabled ? "GASLESS ON" : "GASLESS OFF"}
          </button>
        </div>
      </div>

      {gaslessEnabled && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-[10px] text-text-tertiary leading-relaxed">
            Gasless mode active. Transactions are sent as ERC-4337 UserOperations via the Kite bundler.
            No native KITE gas required — fees are paid from the AA wallet balance or subsidized.
          </p>
        </div>
      )}
    </div>
  );
}
