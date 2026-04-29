"use client";

import { useState, useEffect } from "react";

export function useRealChainId(): number | undefined {
  const [chainId, setChainId] = useState<number | undefined>(undefined);

  useEffect(() => {
    const ethereum = (window as unknown as { ethereum?: { request: (args: { method: string }) => Promise<string>; on?: (event: string, handler: (chainId: string) => void) => void; removeListener?: (event: string, handler: (chainId: string) => void) => void } }).ethereum;
    if (!ethereum) return;

    const readChain = async () => {
      try {
        const hex = await ethereum.request({ method: "eth_chainId" });
        setChainId(parseInt(hex, 16));
      } catch {
        // ignore
      }
    };

    readChain();

    const handleChange = (hex: string) => setChainId(parseInt(hex, 16));
    if (ethereum.on) {
      ethereum.on("chainChanged", handleChange);
    }

    return () => {
      if (ethereum.removeListener) {
        ethereum.removeListener("chainChanged", handleChange);
      }
    };
  }, []);

  return chainId;
}
