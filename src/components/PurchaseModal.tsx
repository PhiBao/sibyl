"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { PULSE_SCORE_ADDRESS, PULSE_SCORE_ABI, USDC_ADDRESS, ERC20_ABI, USDC_DECIMALS, kiteTestnet, addKiteNetwork } from "@/lib/web3";
import { useRealChainId } from "@/hooks/useRealChainId";
import { useAAWallet } from "@/hooks/useAAWallet";
import { useAgentData } from "@/hooks/useAgentData";
import { encodeApproveUSDC, encodeRequestService, encodeSettlePayment, encodeRefreshSession } from "@/lib/aa-sdk";

const USDCD = 10 ** USDC_DECIMALS;
const MAX_UINT256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

interface Service {
  id: number;
  name: string;
  provider: string;
  category: string;
  price: number;
  minScore: number;
  endpoint: string;
}

interface PurchaseModalProps {
  service: Service;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PurchaseModal({ service, onClose, onSuccess }: PurchaseModalProps) {
  const { address, connector } = useAccount();
  const realChainId = useRealChainId();
  const isWrongChain = realChainId !== undefined && realChainId !== kiteTestnet.id;
  const [addingNetwork, setAddingNetwork] = useState(false);
  const [approveMode, setApproveMode] = useState<"exact" | "max">("exact");
  const [settleInitiated, setSettleInitiated] = useState(false);
  const aa = useAAWallet();
  const canonicalAddress = aa.canonicalAddress;
  const ca = canonicalAddress as `0x${string}` | null;

  // Flow step tracking
  const [step, setStep] = useState<"approve" | "request" | "settle" | "success">("approve");

  // Agent data for session budget / interval checks
  const agent = useAgentData(ca as `0x${string}`);
  const sessionRemaining = agent.sessionRemaining;
  const hasSessionBudget = sessionRemaining >= service.price;
  const now = Math.floor(Date.now() / 1000);
  const secondsSinceLastTxn = agent.totalTxns > 0 ? now - agent.lastUpdated : Infinity;
  const MIN_TXN_INTERVAL = 10;
  const canSettleDueToInterval = secondsSinceLastTxn >= MIN_TXN_INTERVAL;
  const intervalCountdown = Math.max(0, MIN_TXN_INTERVAL - secondsSinceLastTxn);

  // Reset AA status + step when modal opens
  useEffect(() => {
    aa.resetStatus();
    setStep("approve");
    setSettleInitiated(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signUserOp = async (userOpHash: string): Promise<string> => {
    if (!address) throw new Error("Wallet not available");
    const provider = (await connector?.getProvider()) as any;
    if (!provider) throw new Error("Wallet provider not available. Try reconnecting your wallet.");
    return provider.request({
      method: "personal_sign",
      params: [userOpHash, address],
    });
  };

  const priceRaw = BigInt(Math.round(service.price * USDCD));

  // Check USDC balance + allowance of AA wallet (live, every 3s)
  const { data: usdcBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: ca ? [ca] : undefined,
    query: { enabled: !!ca, refetchInterval: 3000 },
  });

  const { data: allowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: ca ? [ca, PULSE_SCORE_ADDRESS] : undefined,
    query: { enabled: !!ca, refetchInterval: 3000 },
  });

  const hasAllowance = allowance !== undefined && allowance >= priceRaw;
  const usdcBalanceNum = usdcBalance !== undefined ? Number(usdcBalance) / USDCD : 0;
  const hasEnoughUsdc = usdcBalanceNum >= service.price;

  // Auto-advance from approve -> request when allowance confirms
  useEffect(() => {
    if (hasAllowance && step === "approve") {
      setStep("request");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAllowance]);

  const handleAddNetwork = async () => {
    setAddingNetwork(true);
    try {
      await addKiteNetwork();
    } catch {
      // Silently fail
    } finally {
      setAddingNetwork(false);
    }
  };

  const handleApprove = async () => {
    if (!canonicalAddress) return;
    setSettleInitiated(false);
    try {
      await aa.sendGaslessTx(
        { target: USDC_ADDRESS, callData: encodeApproveUSDC(PULSE_SCORE_ADDRESS, approveMode === "max" ? MAX_UINT256 : priceRaw) },
        signUserOp
      );
    } catch {
      // Error handled by hook
    }
  };

  const handleRequest = async () => {
    if (!canonicalAddress) return;
    setSettleInitiated(false);
    try {
      await aa.sendGaslessTx(
        { target: PULSE_SCORE_ADDRESS, callData: encodeRequestService(BigInt(service.id), canonicalAddress) },
        signUserOp
      );
      setStep("settle");
    } catch {
      // Error handled by hook
    }
  };

  const handleSettle = async () => {
    if (!canonicalAddress) return;
    setSettleInitiated(true);
    try {
      await aa.sendGaslessTx(
        { target: PULSE_SCORE_ADDRESS, callData: encodeSettlePayment(BigInt(service.id), canonicalAddress, true) },
        signUserOp
      );
    } catch {
      // Error handled by hook
    }
  };

  const handleRefreshSession = async () => {
    if (!canonicalAddress) return;
    try {
      await aa.sendGaslessTx(
        { target: PULSE_SCORE_ADDRESS, callData: encodeRefreshSession() },
        signUserOp
      );
    } catch {
      // Error handled by hook
    }
  };

  const error = aa.lastTxError;
  const isApproving = aa.lastTxStatus === "pending" && step === "approve";
  const isRequesting = aa.lastTxStatus === "pending" && step === "request";
  const isSettling = aa.lastTxStatus === "pending" && step === "settle";
  const showSettleSuccess = settleInitiated && step === "settle" && aa.lastTxStatus === "success" && aa.lastTxHash;

  if (showSettleSuccess) {
    return (
      <div className="fixed inset-0 z-[999] flex items-center justify-center px-4 py-10 overflow-y-auto">
        <div className="absolute inset-0 bg-black/90" onClick={onClose} />
        <div className="relative w-full max-w-sm terminal-panel-active p-6 shadow-2xl text-center fade-in mx-4">
          <div className="w-14 h-14 border border-neon-green/40 bg-neon-green/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-neon-green">✓</span>
          </div>
          <h3 className="text-lg font-bold mb-1 text-text-primary">X402 SETTLED</h3>
          <p className="text-text-secondary text-sm mb-6">${service.price} USDC transferred to provider. Score updated.</p>
          <button
            onClick={() => {
              onClose();
              onSuccess();
            }}
            className="neon-btn-primary w-full py-2.5 text-sm rounded-sm"
          >
            [ DISMISS ]
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center px-4 py-10 overflow-y-auto">
      <div className="absolute inset-0 bg-black/90" onClick={onClose} />
      <div className="relative w-full max-w-sm terminal-panel-active p-0 shadow-2xl fade-in mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-surface-raised">
          <h3 className="text-sm font-bold tracking-wider text-neon-green">[ X402_SETTLEMENT ]</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center border border-border text-text-tertiary hover:text-neon-green hover:border-neon-green/40 transition-all"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {/* Service Info */}
          <div className="border border-border p-5 mb-5 bg-surface-raised">
            <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-bold mb-1">{service.category}</p>
            <p className="text-[15px] font-bold text-text-primary">{service.name}</p>
            <p className="text-[11px] text-text-secondary font-mono mt-1">{`>`} {service.provider.slice(0, 10)}...{service.provider.slice(-8)}</p>
            <p className="text-[10px] text-text-tertiary font-mono mt-1 truncate">{service.endpoint}</p>
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
              <div>
                <p className="text-[10px] text-text-tertiary uppercase font-bold mb-1">Price</p>
                <p className="text-[18px] font-bold font-mono text-neon-cyan">${service.price}</p>
              </div>
              <div>
                <p className="text-[10px] text-text-tertiary uppercase font-bold mb-1">Score Impact</p>
                <p className="text-[13px] font-bold text-neon-green">+6 TO +8 PTS</p>
              </div>
            </div>
          </div>

          {/* Wallet Status */}
          <div className="border border-border p-4 mb-5 bg-surface-raised">
            <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-bold mb-3">WALLET_STATUS</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-text-secondary">AA Wallet</span>
                <span className="font-mono text-neon-cyan">{canonicalAddress ? `${canonicalAddress.slice(0, 10)}...${canonicalAddress.slice(-8)}` : "Loading..."}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-text-secondary">USDC Balance</span>
                <span className={`font-mono font-bold ${usdcBalanceNum >= service.price ? "text-neon-green" : "text-danger"}`}>
                  ${usdcBalanceNum.toFixed(4)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-text-secondary">Required</span>
                <span className="font-mono font-bold text-neon-cyan">${service.price.toFixed(4)}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-text-secondary">Allowance</span>
                <span className={`font-mono font-bold ${hasAllowance ? "text-neon-green" : "text-danger"}`}>
                  {hasAllowance ? "SUFFICIENT" : "NONE"}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-text-secondary">Session Budget</span>
                <span className={`font-mono font-bold ${hasSessionBudget ? "text-neon-green" : "text-danger"}`}>
                  ${sessionRemaining.toFixed(2)} / ${agent.sessionBudget.toFixed(0)}
                </span>
              </div>
            </div>
          </div>

          {/* x402 Flow Steps */}
          <div className="border border-border p-4 mb-5 bg-surface-raised">
            <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-bold mb-3">x402 FLOW</p>
            <div className="space-y-2">
              <div className={`flex items-center gap-2 text-[11px] ${step !== "approve" ? "text-neon-green" : "text-text-secondary"}`}>
                <span className="w-4 h-4 border flex items-center justify-center text-[10px] font-bold shrink-0">{step !== "approve" ? "✓" : "1"}</span>
                Approve USDC spend
              </div>
              <div className={`flex items-center gap-2 text-[11px] ${step === "settle" || step === "success" ? "text-neon-green" : step === "request" ? "text-text-secondary" : "text-text-tertiary"}`}>
                <span className="w-4 h-4 border flex items-center justify-center text-[10px] font-bold shrink-0">{step === "settle" || step === "success" ? "✓" : "2"}</span>
                Request service authorization
              </div>
              <div className={`flex items-center gap-2 text-[11px] ${step === "success" ? "text-neon-green" : step === "settle" ? "text-text-secondary" : "text-text-tertiary"}`}>
                <span className="w-4 h-4 border flex items-center justify-center text-[10px] font-bold shrink-0">{step === "success" ? "✓" : "3"}</span>
                Settle payment onchain
              </div>
            </div>
          </div>

          {/* Warnings */}
          {!isWrongChain && usdcBalance !== undefined && !hasEnoughUsdc && (
            <div className="mb-5 border-2 border-danger bg-danger/10 p-4">
              <p className="text-[13px] text-danger font-bold tracking-wider mb-2">[ INSUFFICIENT USDC ]</p>
              <p className="text-[12px] text-text-secondary mb-3">
                AA Wallet Balance: <span className="text-danger font-mono font-bold">${usdcBalanceNum.toFixed(4)}</span> USDC. Need <span className="text-neon-cyan font-mono font-bold">${service.price.toFixed(4)}</span> USDC.
              </p>
              <p className="text-[11px] text-text-secondary mb-3">
                Fund your AA wallet from the header dropdown or faucet.
              </p>
              <a
                href="/faucet"
                onClick={(e) => { e.preventDefault(); onClose(); window.location.href = "/faucet"; }}
                className="inline-block px-3 py-1.5 text-[11px] font-bold tracking-wider border border-neon-cyan text-neon-cyan hover:bg-neon-cyan/20 transition-all"
              >
                [ GET TEST USDC ]
              </a>
            </div>
          )}

          {!isWrongChain && !hasSessionBudget && (
            <div className="mb-5 border-2 border-danger bg-danger/10 p-4">
              <p className="text-[13px] text-danger font-bold tracking-wider mb-2">[ SESSION BUDGET EXHAUSTED ]</p>
              <p className="text-[12px] text-text-secondary mb-3">
                Session spent: <span className="text-danger font-mono font-bold">${agent.sessionSpent.toFixed(2)}</span> / <span className="text-neon-green font-mono font-bold">${agent.sessionBudget.toFixed(0)}</span> USDC.
              </p>
              <button
                onClick={handleRefreshSession}
                disabled={aa.lastTxStatus === "pending"}
                className="px-3 py-1.5 text-[11px] font-bold tracking-wider border border-neon-cyan text-neon-cyan hover:bg-neon-cyan/20 transition-all disabled:opacity-50"
              >
                {aa.lastTxStatus === "pending" ? "REFRESHING..." : "[ REFRESH SESSION ]"}
              </button>
            </div>
          )}

          {!isWrongChain && !canSettleDueToInterval && agent.totalTxns > 0 && (
            <div className="mb-5 border-2 border-neon-yellow bg-neon-yellow/10 p-4">
              <p className="text-[13px] text-neon-yellow font-bold tracking-wider mb-2">[ RATE LIMIT ]</p>
              <p className="text-[12px] text-text-secondary">
                MIN_TXN_INTERVAL active. Wait <span className="text-neon-yellow font-mono font-bold">{intervalCountdown}s</span> before next settlement.
              </p>
            </div>
          )}

          {isWrongChain && (
            <div className="mb-5 border-2 border-danger bg-danger/10 p-4">
              <p className="text-[13px] text-danger font-bold tracking-wider mb-2">[ WRONG NETWORK ]</p>
              <p className="text-[12px] text-text-secondary mb-3">
                Wallet is on chain <span className="text-danger font-mono font-bold">{realChainId ?? "?"}</span>. Switch to <span className="text-neon-green font-mono font-bold">Kite Testnet (ID: {kiteTestnet.id})</span>.
              </p>
              <button
                onClick={handleAddNetwork}
                disabled={addingNetwork}
                className="px-3 py-1.5 text-[11px] font-bold tracking-wider border border-neon-cyan text-neon-cyan hover:bg-neon-cyan/20 transition-all disabled:opacity-50"
              >
                {addingNetwork ? "ADDING..." : "[ + ADD KITE TESTNET ]"}
              </button>
            </div>
          )}

          {error && (
            <div className="mb-5 p-3 border border-danger/30 bg-danger/10 text-[11px] text-danger">
              {String(error).slice(0, 280)}
            </div>
          )}

          {/* Approve Mode Toggle */}
          {step === "approve" && (
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setApproveMode("exact")}
                className={`flex-1 py-1.5 text-[10px] font-bold tracking-wider border transition-all ${
                  approveMode === "exact"
                    ? "border-neon-green/50 bg-neon-green/10 text-neon-green"
                    : "border-border text-text-tertiary hover:text-text-secondary"
                }`}
              >
                EXACT (${service.price})
              </button>
              <button
                onClick={() => setApproveMode("max")}
                className={`flex-1 py-1.5 text-[10px] font-bold tracking-wider border transition-all ${
                  approveMode === "max"
                    ? "border-neon-green/50 bg-neon-green/10 text-neon-green"
                    : "border-border text-text-tertiary hover:text-text-secondary"
                }`}
              >
                MAX (UNLIMITED)
              </button>
            </div>
          )}

          {/* Action Button */}
          {step === "approve" && (
            <button
              onClick={handleApprove}
              disabled={isApproving || isWrongChain || !hasEnoughUsdc || !hasSessionBudget || !canSettleDueToInterval}
              className={`w-full py-2.5 text-sm rounded-sm disabled:opacity-40 flex items-center justify-center gap-2 font-bold tracking-wider transition-all ${
                isWrongChain || !hasEnoughUsdc || !hasSessionBudget || !canSettleDueToInterval
                  ? "border border-danger/40 text-danger/60 cursor-not-allowed"
                  : "neon-btn-primary"
              }`}
            >
              {isApproving && <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
              {!hasEnoughUsdc ? "[ INSUFFICIENT USDC ]"
                : !hasSessionBudget ? "[ SESSION EXHAUSTED ]"
                : !canSettleDueToInterval ? `[ WAIT ${intervalCountdown}s ]`
                : isWrongChain ? "[ SWITCH TO KITE TESTNET ]"
                : approveMode === "max"
                  ? "[ APPROVE MAX USDC ]"
                  : `[ APPROVE ${service.price} USDC ]`}
            </button>
          )}

          {step === "request" && (
            <button
              onClick={handleRequest}
              disabled={isRequesting || isWrongChain || !hasEnoughUsdc || !hasSessionBudget || !canSettleDueToInterval}
              className={`w-full py-2.5 text-sm rounded-sm disabled:opacity-40 flex items-center justify-center gap-2 font-bold tracking-wider transition-all ${
                isWrongChain || !hasEnoughUsdc || !hasSessionBudget || !canSettleDueToInterval
                  ? "border border-danger/40 text-danger/60 cursor-not-allowed"
                  : "neon-btn-primary"
              }`}
            >
              {isRequesting && <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
              {!hasEnoughUsdc ? "[ INSUFFICIENT USDC ]"
                : !hasSessionBudget ? "[ SESSION EXHAUSTED ]"
                : !canSettleDueToInterval ? `[ WAIT ${intervalCountdown}s ]`
                : isWrongChain ? "[ SWITCH TO KITE TESTNET ]"
                : "[ REQUEST SERVICE ]"}
            </button>
          )}

          {step === "settle" && (
            <button
              onClick={handleSettle}
              disabled={isSettling || isWrongChain || !hasEnoughUsdc || !hasSessionBudget || !canSettleDueToInterval}
              className={`w-full py-2.5 text-sm rounded-sm disabled:opacity-40 flex items-center justify-center gap-2 font-bold tracking-wider transition-all ${
                isWrongChain || !hasEnoughUsdc || !hasSessionBudget || !canSettleDueToInterval
                  ? "border border-danger/40 text-danger/60 cursor-not-allowed"
                  : "neon-btn-primary"
              }`}
            >
              {isSettling && <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
              {!hasEnoughUsdc ? "[ INSUFFICIENT USDC ]"
                : !hasSessionBudget ? "[ SESSION EXHAUSTED ]"
                : !canSettleDueToInterval ? `[ WAIT ${intervalCountdown}s ]`
                : isWrongChain ? "[ SWITCH TO KITE TESTNET ]"
                : "[ SETTLE X402 PAYMENT ]"}
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full mt-3 py-2 text-[11px] text-text-tertiary hover:text-text-secondary transition-colors font-bold tracking-wider"
          >
            [ CANCEL ]
          </button>
        </div>
      </div>
    </div>
  );
}
