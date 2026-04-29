"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { getAAWalletAddress, buildUserOp, sendSignedUserOp, GaslessTxRequest } from "@/lib/aa-sdk";

export interface AAWalletState {
  aaAddress: string | null;
  isLoading: boolean;
  gaslessEnabled: boolean;
  lastTxHash: string | null;
  lastTxStatus: "idle" | "pending" | "success" | "error";
  lastTxError: string | null;
}

export function useAAWallet() {
  const { address, isConnected } = useAccount();
  const [state, setState] = useState<AAWalletState>({
    aaAddress: null,
    isLoading: false,
    gaslessEnabled: false,
    lastTxHash: null,
    lastTxStatus: "idle",
    lastTxError: null,
  });

  useEffect(() => {
    let cancelled = false;
    if (isConnected && address) {
      getAAWalletAddress(address)
        .then((aaAddr) => {
          if (!cancelled) setState((prev) => ({ ...prev, aaAddress: aaAddr }));
        })
        .catch((err) => {
          console.error("getAAWalletAddress failed:", err);
          if (!cancelled) setState((prev) => ({ ...prev, aaAddress: null }));
        });
    } else {
      setState((prev) => ({ ...prev, aaAddress: null, gaslessEnabled: false }));
    }
    return () => { cancelled = true; };
  }, [address, isConnected]);

  const toggleGasless = useCallback(() => {
    setState((prev) => ({ ...prev, gaslessEnabled: !prev.gaslessEnabled }));
  }, []);

  const sendGaslessTx = useCallback(
    async (request: GaslessTxRequest, signFunction: (hash: string) => Promise<string>) => {
      if (!address) throw new Error("No wallet connected");
      setState((prev) => ({ ...prev, lastTxStatus: "pending", lastTxError: null, lastTxHash: null }));
      try {
        // 1. Build UserOp server-side
        const { userOp, hash } = await buildUserOp(address, request);

        // 2. Sign raw userOpHash via wallet (wallet applies Ethereum prefix via personal_sign)
        const signature = await signFunction(hash);

        // 3. Attach signature and send to bundler
        const signedUserOp = { ...userOp, signature };
        const result = await sendSignedUserOp(signedUserOp);

        if (result.status === "success") {
          setState((prev) => ({
            ...prev,
            lastTxStatus: "success",
            lastTxHash: result.userOpHash,
          }));
        } else {
          setState((prev) => ({
            ...prev,
            lastTxStatus: "error",
            lastTxError: `Bundler status: ${result.status}`,
          }));
        }
        return result;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("sendGaslessTx failed:", msg);
        setState((prev) => ({ ...prev, lastTxStatus: "error", lastTxError: msg }));
        throw err;
      }
    },
    [address]
  );

  const resetStatus = useCallback(() => {
    setState((prev) => ({ ...prev, lastTxStatus: "idle", lastTxError: null, lastTxHash: null }));
  }, []);

  return {
    ...state,
    toggleGasless,
    sendGaslessTx,
    resetStatus,
  };
}
