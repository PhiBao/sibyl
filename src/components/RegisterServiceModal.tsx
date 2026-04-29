"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { PULSE_SCORE_ADDRESS, PULSE_SCORE_ABI, USDC_DECIMALS, kiteTestnet, addKiteNetwork } from "@/lib/web3";
import { useRealChainId } from "@/hooks/useRealChainId";

const USDCD = 10 ** USDC_DECIMALS;

interface RegisterServiceModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function RegisterServiceModal({ onClose, onSuccess }: RegisterServiceModalProps) {
  const { address } = useAccount();
  const realChainId = useRealChainId();
  const isWrongChain = realChainId !== undefined && realChainId !== kiteTestnet.id;
  const [addingNetwork, setAddingNetwork] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [price, setPrice] = useState("");
  const [minScore, setMinScore] = useState("0");

  const {
    writeContract: writeRegister,
    data: registerHash,
    isPending: isRegisterPending,
    error: registerError,
    reset: resetRegister,
  } = useWriteContract();

  const { isLoading: isRegisterConfirming, isSuccess: isRegistered } = useWaitForTransactionReceipt({ hash: registerHash });

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

  const handleSubmit = () => {
    if (!address) return;
    const priceNum = parseFloat(price);
    if (!name.trim() || !description.trim() || !endpoint.trim() || isNaN(priceNum) || priceNum <= 0) return;
    resetRegister();
    writeRegister({
      address: PULSE_SCORE_ADDRESS,
      abi: PULSE_SCORE_ABI,
      functionName: "registerService",
      args: [
        name.trim(),
        description.trim(),
        endpoint.trim(),
        BigInt(Math.round(priceNum * USDCD)),
        BigInt(parseInt(minScore, 10) || 0),
      ],
    });
  };

  const isSubmitting = isRegisterPending || isRegisterConfirming;

  if (isRegistered && registerHash && !isRegisterPending && !isRegisterConfirming) {
    return (
      <div className="fixed inset-0 z-[999] flex items-center justify-center px-4 py-10 overflow-y-auto">
        <div className="absolute inset-0 bg-black/90" onClick={onClose} />
        <div className="relative w-full max-w-md terminal-panel-active p-6 shadow-2xl text-center fade-in mx-4">
          <div style={{ width: "64px", height: "64px", margin: "0 auto 24px", border: "2px solid #00ff41", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00ff41" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-neon-green mb-2">SERVICE REGISTERED</h3>
          <p className="text-xs text-text-secondary mb-6 font-mono">
            Your service is now live on the Sibyl Service Registry.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onSuccess}
              className="flex-1 py-3 text-[11px] font-bold tracking-wider border border-neon-green/50 bg-neon-green/10 text-neon-green hover:bg-neon-green/20 transition-all"
            >
              [ DONE ]
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 text-[11px] font-bold tracking-wider border border-border text-text-secondary hover:text-text-primary hover:border-text-secondary transition-all"
            >
              [ CLOSE ]
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isValid = name.trim() && description.trim() && endpoint.trim() && parseFloat(price) > 0;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center px-4 py-10 overflow-y-auto">
      <div className="absolute inset-0 bg-black/90" onClick={onClose} />
      <div className="relative w-full max-w-md terminal-panel-active p-6 shadow-2xl fade-in mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: "1px solid #222" }}>
          <div className="flex items-center gap-2">
            <span className="text-neon-green text-xs font-bold">[</span>
            <span className="text-xs font-bold tracking-widest text-text-secondary">REGISTER_SERVICE</span>
            <span className="text-neon-green text-xs font-bold">]</span>
          </div>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary text-lg leading-none">&times;</button>
        </div>

        {/* Wrong Network */}
        {isWrongChain && (
          <div className="mb-4 p-3 border border-neon-yellow/40 bg-neon-yellow/10 text-neon-yellow text-[11px] font-mono">
            <p className="font-bold mb-1">WRONG NETWORK</p>
            <p className="mb-2">Switch to Kite Testnet (chainId: 2368) to register services.</p>
            <button
              onClick={handleAddNetwork}
              disabled={addingNetwork}
              className="px-3 py-1.5 text-[10px] font-bold tracking-wider border border-neon-yellow/50 text-neon-yellow hover:bg-neon-yellow/20 transition-all"
            >
              {addingNetwork ? "[ ADDING... ]" : "[ + ADD KITE TESTNET ]"}
            </button>
          </div>
        )}

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] text-text-tertiary uppercase tracking-wider font-bold mb-1.5">Service Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. GPT-4 Turbo Inference"
              disabled={isWrongChain || isSubmitting}
              className="w-full bg-[#0a0a0a] border border-border text-text-primary text-[13px] px-3 py-2.5 font-mono focus:outline-none focus:border-neon-green/50 disabled:opacity-40"
            />
          </div>

          <div>
            <label className="block text-[10px] text-text-tertiary uppercase tracking-wider font-bold mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does your agent service do?"
              rows={3}
              disabled={isWrongChain || isSubmitting}
              className="w-full bg-[#0a0a0a] border border-border text-text-primary text-[13px] px-3 py-2.5 font-mono focus:outline-none focus:border-neon-green/50 disabled:opacity-40 resize-none"
            />
          </div>

          <div>
            <label className="block text-[10px] text-text-tertiary uppercase tracking-wider font-bold mb-1.5">Endpoint URL</label>
            <input
              type="text"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="https://api.your-service.ai/v1"
              disabled={isWrongChain || isSubmitting}
              className="w-full bg-[#0a0a0a] border border-border text-text-primary text-[13px] px-3 py-2.5 font-mono focus:outline-none focus:border-neon-green/50 disabled:opacity-40"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-text-tertiary uppercase tracking-wider font-bold mb-1.5">Price / Call (USDC)</label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.050"
                disabled={isWrongChain || isSubmitting}
                className="w-full bg-[#0a0a0a] border border-border text-text-primary text-[13px] px-3 py-2.5 font-mono focus:outline-none focus:border-neon-green/50 disabled:opacity-40"
              />
            </div>
            <div>
              <label className="block text-[10px] text-text-tertiary uppercase tracking-wider font-bold mb-1.5">Min Score</label>
              <select
                value={minScore}
                onChange={(e) => setMinScore(e.target.value)}
                disabled={isWrongChain || isSubmitting}
                className="w-full bg-[#0a0a0a] border border-border text-text-primary text-[13px] px-3 py-2.5 font-mono focus:outline-none focus:border-neon-green/50 disabled:opacity-40 appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}
              >
                <option value="0">0 — Unverified</option>
                <option value="200">200 — Newcomer</option>
                <option value="400">400 — Trusted</option>
                <option value="600">600 — Reliable</option>
                <option value="800">800 — Elite</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error */}
        {registerError && (
          <div className="mt-4 p-3 border border-neon-red/40 bg-neon-red/10 text-neon-red text-[11px] font-mono">
            <p className="font-bold mb-1">TRANSACTION FAILED</p>
            <p>{registerError.message || "Unknown error"}</p>
          </div>
        )}

        {/* Submit */}
        <div className="mt-6 pt-4" style={{ borderTop: "1px solid #222" }}>
          <button
            onClick={handleSubmit}
            disabled={!isValid || isWrongChain || isSubmitting}
            className={`w-full py-3 text-[11px] font-bold tracking-wider border transition-all ${
              isValid && !isWrongChain
                ? "border-neon-green/50 bg-neon-green/10 text-neon-green hover:bg-neon-green/20"
                : "border-border text-text-tertiary cursor-not-allowed"
            }`}
          >
            {isSubmitting ? "[ CONFIRMING... ]" : "[ REGISTER ON-CHAIN ]"}
          </button>
          <p className="text-[10px] text-text-tertiary text-center mt-3 font-mono">
            Requires wallet signature. Gas paid in KITE.
          </p>
        </div>
      </div>
    </div>
  );
}
