"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { getAAWalletAddress, buildUserOp, sendSignedUserOp, GaslessTxRequest } from "@/lib/aa-sdk";

export interface AAWalletState {
  aaAddress: string | null;
  isLoading: boolean;
  lastTxHash: string | null;
  lastTxStatus: "idle" | "pending" | "success" | "error";
  lastTxError: string | null;
  lastTxMode: "sponsored" | "token" | null;
  lastEstimationFailed: boolean;
}

export function useAAWallet() {
  const { address, isConnected } = useAccount();
  const [state, setState] = useState<AAWalletState>({
    aaAddress: null,
    isLoading: false,
    lastTxHash: null,
    lastTxStatus: "idle",
    lastTxError: null,
    lastTxMode: null,
    lastEstimationFailed: false,
  });

  useEffect(() => {
    let cancelled = false;
    if (isConnected && address) {
      setState((prev) => ({ ...prev, isLoading: true }));
      getAAWalletAddress(address)
        .then((aaAddr) => {
          if (!cancelled) setState((prev) => ({ ...prev, aaAddress: aaAddr, isLoading: false }));
        })
        .catch((err) => {
          console.error("getAAWalletAddress failed:", err);
          if (!cancelled) setState((prev) => ({ ...prev, aaAddress: null, isLoading: false }));
        });
    } else {
      setState((prev) => ({ ...prev, aaAddress: null, isLoading: false, lastTxMode: null, lastEstimationFailed: false }));
    }
    return () => { cancelled = true; };
  }, [address, isConnected]);

  const sendGaslessTx = useCallback(
    async (request: GaslessTxRequest, signFunction: (hash: string) => Promise<string>) => {
      if (!address) throw new Error("No wallet connected");
      setState((prev) => ({ ...prev, lastTxStatus: "pending", lastTxError: null, lastTxHash: null, lastTxMode: null, lastEstimationFailed: false }));
      try {
        const { userOp, hash, mode, estimationFailed, estimationError } = await buildUserOp(address, request);
        console.log(`[AA] Gasless mode: ${mode}, estimationFailed: ${estimationFailed}`);

        const signature = await signFunction(hash);
        const signedUserOp = { ...userOp, signature };
        const result = await sendSignedUserOp(signedUserOp);

        if (result.status === "success") {
          setState((prev) => ({
            ...prev,
            lastTxStatus: "success",
            lastTxHash: result.userOpHash,
            lastTxMode: mode || null,
            lastEstimationFailed: estimationFailed || false,
          }));
        } else {
          setState((prev) => ({
            ...prev,
            lastTxStatus: "error",
            lastTxError: `Bundler status: ${result.status}${estimationFailed ? " (gas estimation failed — paymaster may be underfunded)" : ""}`,
            lastTxMode: mode || null,
            lastEstimationFailed: estimationFailed || false,
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
    setState((prev) => ({ ...prev, lastTxStatus: "idle", lastTxError: null, lastTxHash: null, lastTxMode: null, lastEstimationFailed: false }));
  }, []);

  const canonicalAddress = state.aaAddress || address || null;
  const isAAMode = !!state.aaAddress;

  return {
    ...state,
    canonicalAddress,
    isAAMode,
    sendGaslessTx,
    resetStatus,
  };
}
