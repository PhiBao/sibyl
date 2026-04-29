"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useWalletClient } from "wagmi";
import { PULSE_SCORE_ADDRESS, PULSE_SCORE_ABI, USDC_ADDRESS, ERC20_ABI, USDC_DECIMALS, kiteTestnet, addKiteNetwork } from "@/lib/web3";
import { useRealChainId } from "@/hooks/useRealChainId";
import { useAAWallet } from "@/hooks/useAAWallet";
import { encodeApproveUSDC, encodeSettlePayment } from "@/lib/aa-sdk";

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
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const realChainId = useRealChainId();
  const isWrongChain = realChainId !== undefined && realChainId !== kiteTestnet.id;
  const [addingNetwork, setAddingNetwork] = useState(false);
  const [approveMode, setApproveMode] = useState<"exact" | "max">("exact");
  const [gaslessTxId, setGaslessTxId] = useState<number>(0);
  const [settleInitiated, setSettleInitiated] = useState(false);
  const aa = useAAWallet();

  // Reset AA status when modal opens to prevent stale success states
  useEffect(() => {
    aa.resetStatus();
  }, []);

  const signUserOp = async (userOpHash: string): Promise<string> => {
    if (!walletClient || !address) throw new Error("Wallet not available");
    return (walletClient as any).request({
      method: "personal_sign",
      params: [userOpHash, address],
    });
  };

  const priceRaw = BigInt(Math.round(service.price * USDCD));

  // Check USDC balance + allowance (live, every 3s)
  const { data: usdcBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 3000 },
  });

  const { data: allowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address ? [address, PULSE_SCORE_ADDRESS] : undefined,
    query: { enabled: !!address, refetchInterval: 3000 },
  });

  const hasAllowance = allowance !== undefined && allowance >= priceRaw;
  const usdcBalanceNum = usdcBalance !== undefined ? Number(usdcBalance) / USDCD : 0;
  const hasEnoughUsdc = usdcBalanceNum >= service.price;

  // USDC approval
  const {
    writeContract: writeApprove,
    data: approveHash,
    isPending: isApprovePending,
    error: approveError,
    reset: resetApprove,
  } = useWriteContract();
  const { isLoading: isApproveConfirming } = useWaitForTransactionReceipt({ hash: approveHash });

  // Settle payment
  const {
    writeContract: writeSettle,
    data: settleHash,
    isPending: isSettlePending,
    error: settleError,
    reset: resetSettle,
  } = useWriteContract();
  const { isLoading: isSettleConfirming, isSuccess: isSettled } = useWaitForTransactionReceipt({ hash: settleHash });

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
    if (!address) return;
    resetSettle();
    setSettleInitiated(false);
    if (aa.gaslessEnabled) {
      try {
        const txId = Date.now();
        setGaslessTxId(txId);
        await aa.sendGaslessTx(
          { target: USDC_ADDRESS, callData: encodeApproveUSDC(PULSE_SCORE_ADDRESS, approveMode === "max" ? MAX_UINT256 : priceRaw) },
          signUserOp
        );
      } catch {
        // Error handled by hook
      }
    } else {
      writeApprove({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [PULSE_SCORE_ADDRESS, approveMode === "max" ? MAX_UINT256 : priceRaw],
      });
    }
  };

  const handleSettle = async () => {
    if (!address) return;
    setSettleInitiated(true);
    resetApprove();
    if (aa.gaslessEnabled) {
      try {
        await aa.sendGaslessTx(
          { target: PULSE_SCORE_ADDRESS, callData: encodeSettlePayment(BigInt(service.id), address, true) },
          signUserOp
        );
      } catch {
        // Error handled by hook
      }
    } else {
      writeSettle({
        address: PULSE_SCORE_ADDRESS,
        abi: PULSE_SCORE_ABI,
        functionName: "settlePayment",
        args: [BigInt(service.id), address, true],
      });
    }
  };

  const error = approveError || settleError || aa.lastTxError;
  const isApproving = (isApprovePending || isApproveConfirming) || (aa.gaslessEnabled && aa.lastTxStatus === "pending" && !hasAllowance);
  const isSettling = (isSettlePending || isSettleConfirming) || (aa.gaslessEnabled && aa.lastTxStatus === "pending" && hasAllowance);

  const showSettleSuccess = (settleInitiated && isSettled && settleHash && !isSettlePending && !isSettleConfirming) || (aa.gaslessEnabled && aa.lastTxStatus === "success" && aa.lastTxHash);

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
            </div>
          </div>

          {/* Gasless Toggle */}
          {aa.aaAddress && (
            <div className="border border-border p-4 mb-5 bg-surface-raised">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-bold mb-1">ERC-4337 GASLESS</p>
                  <p className="text-[11px] font-mono text-neon-cyan">{aa.aaAddress.slice(0, 10)}...{aa.aaAddress.slice(-8)}</p>
                </div>
                <button
                  onClick={aa.toggleGasless}
                  className={`px-3 py-1.5 text-[10px] font-bold tracking-wider border transition-all ${
                    aa.gaslessEnabled
                      ? "border-neon-green/50 bg-neon-green/10 text-neon-green"
                      : "border-border text-text-tertiary hover:text-text-secondary"
                  }`}
                >
                  {aa.gaslessEnabled ? "⚡ ON" : "OFF"}
                </button>
              </div>
              {aa.gaslessEnabled && (
                <p className="text-[10px] text-text-tertiary mt-2">No KITE gas required. UserOp via Kite bundler.</p>
              )}
            </div>
          )}

          {/* x402 Flow Steps */}
          <div className="border border-border p-4 mb-5 bg-surface-raised">
            <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-bold mb-3">x402 FLOW</p>
            <div className="space-y-2">
              <div className={`flex items-center gap-2 text-[11px] ${hasAllowance ? "text-neon-green" : "text-text-secondary"}`}>
                <span className="w-4 h-4 border flex items-center justify-center text-[10px] font-bold shrink-0">{hasAllowance ? "✓" : "1"}</span>
                Approve USDC spend
              </div>
              <div className={`flex items-center gap-2 text-[11px] ${hasAllowance ? "text-text-secondary" : "text-text-tertiary"}`}>
                <span className="w-4 h-4 border flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                Settle payment on-chain
              </div>
            </div>
          </div>

          {/* Warnings */}
          {!isWrongChain && usdcBalance !== undefined && !hasEnoughUsdc && (
            <div className="mb-5 border-2 border-danger bg-danger/10 p-4">
              <p className="text-[13px] text-danger font-bold tracking-wider mb-2">[ INSUFFICIENT USDC ]</p>
              <p className="text-[12px] text-text-secondary mb-3">
                Balance: <span className="text-danger font-mono font-bold">${usdcBalanceNum.toFixed(4)}</span> USDC. Need <span className="text-neon-cyan font-mono font-bold">${service.price.toFixed(4)}</span> USDC.
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
              {typeof error === "string" ? error.slice(0, 200) : error.message?.slice(0, 200) ?? String(error).slice(0, 200)}
            </div>
          )}

          {/* Approve Mode Toggle */}
          {!hasAllowance && (
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
          {hasAllowance ? (
            <button
              onClick={handleSettle}
              disabled={isSettling || isWrongChain || !hasEnoughUsdc}
              className={`w-full py-2.5 text-sm rounded-sm disabled:opacity-40 flex items-center justify-center gap-2 font-bold tracking-wider transition-all ${
                isWrongChain || !hasEnoughUsdc
                  ? "border border-danger/40 text-danger/60 cursor-not-allowed"
                  : "neon-btn-primary"
              }`}
            >
              {isSettling && <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
              {!hasEnoughUsdc ? "[ INSUFFICIENT USDC ]"
                : isWrongChain ? "[ SWITCH TO KITE TESTNET ]"
                : isSettlePending ? "AWAITING SIGNATURE..."
                : isSettleConfirming ? "BROADCASTING..."
                : "[ SETTLE X402 PAYMENT ]"}
            </button>
          ) : (
            <button
              onClick={handleApprove}
              disabled={isApproving || isWrongChain || !hasEnoughUsdc}
              className={`w-full py-2.5 text-sm rounded-sm disabled:opacity-40 flex items-center justify-center gap-2 font-bold tracking-wider transition-all ${
                isWrongChain || !hasEnoughUsdc
                  ? "border border-danger/40 text-danger/60 cursor-not-allowed"
                  : "neon-btn-primary"
              }`}
            >
              {isApproving && <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
              {!hasEnoughUsdc ? "[ INSUFFICIENT USDC ]"
                : isWrongChain ? "[ SWITCH TO KITE TESTNET ]"
                : isApprovePending ? "AWAITING SIGNATURE..."
                : isApproveConfirming ? "BROADCASTING APPROVAL..."
                : approveMode === "max"
                  ? "[ APPROVE MAX USDC ]"
                  : `[ APPROVE ${service.price} USDC ]`}
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
