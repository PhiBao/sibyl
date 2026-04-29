"use client";

import { useState, useCallback } from "react";
import { useRealChainId } from "@/hooks/useRealChainId";
import { kiteTestnet } from "@/lib/web3";

export default function NetworkGuard() {
  const chainId = useRealChainId();
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const isWrong = chainId && chainId !== kiteTestnet.id;

  const addNetwork = useCallback(async () => {
    setAdding(true);
    setAddError(null);
    try {
      const ethereum = (window as unknown as { ethereum?: { request: (args: unknown) => Promise<unknown> } }).ethereum;
      if (!ethereum) {
        setAddError("No wallet detected. Install MetaMask first.");
        return;
      }
      await ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: `0x${kiteTestnet.id.toString(16)}`,
            chainName: kiteTestnet.name,
            nativeCurrency: kiteTestnet.nativeCurrency,
            rpcUrls: ["https://rpc-testnet.gokite.ai"],
            blockExplorerUrls: ["https://testnet.kitescan.ai"],
          },
        ],
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("rejected") || msg.includes("cancelled")) {
        setAddError("Request rejected by user.");
      } else {
        setAddError(msg.slice(0, 150));
      }
    } finally {
      setAdding(false);
    }
  }, []);

  if (!isWrong) return null;

  return (
    <div
      className="fixed top-14 left-0 right-0 z-40 flex items-center justify-center gap-3 px-4 py-2 flex-wrap"
      style={{ background: "rgba(255,0,85,0.15)", borderBottom: "1px solid rgba(255,0,85,0.4)" }}
    >
      <span className="text-[11px] text-danger font-bold tracking-wider">
        [ WRONG NETWORK ] {chainId ? `Connected to chain ${chainId}` : "No network detected"} — Switch to Kite Testnet (ID: {kiteTestnet.id})
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={addNetwork}
          disabled={adding}
          className="px-3 py-1 text-[10px] font-bold tracking-wider border border-neon-cyan text-neon-cyan hover:bg-neon-cyan/20 transition-all disabled:opacity-50"
        >
          {adding ? "ADDING..." : "[ ADD KITE TESTNET ]"}
        </button>
      </div>
      {addError && (
        <span className="text-[10px] text-danger">{addError}</span>
      )}
    </div>
  );
}
