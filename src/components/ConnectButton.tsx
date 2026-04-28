"use client";

import { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import type { Connector } from "wagmi";
import { kiteTestnet } from "@/lib/web3";

const WALLET_ICONS: Record<string, string> = {
  metaMaskSDK: "🦊",
  metaMask: "🦊",
  walletConnect: "🔗",
  coinbaseWalletSDK: "🔵",
  coinbaseWallet: "🔵",
  injected: "🌐",
};

const WALLET_DESCRIPTIONS: Record<string, string> = {
  metaMaskSDK: "Browser extension or mobile app",
  metaMask: "Browser extension or mobile app",
  walletConnect: "Scan QR code with 200+ wallets",
  coinbaseWalletSDK: "Coinbase Wallet app or extension",
  coinbaseWallet: "Coinbase Wallet app or extension",
  injected: "Brave, Rabby, or other browser wallets",
};

export default function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const [showModal, setShowModal] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => setHasMounted(true), []);

  // Auto-switch to Kite testnet
  useEffect(() => {
    if (isConnected && chainId !== kiteTestnet.id) {
      switchChain({ chainId: kiteTestnet.id });
    }
  }, [isConnected, chainId, switchChain]);

  const handleConnect = (connector: Connector) => {
    connect({ connector });
    setShowModal(false);
  };

  if (!hasMounted) return null;

  // Connected state
  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        {chainId !== kiteTestnet.id && (
          <button
            onClick={() => switchChain({ chainId: kiteTestnet.id })}
            className="px-2 py-1 text-[11px] font-medium rounded-md bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25 transition-all"
          >
            Wrong Network
          </button>
        )}
        <button
          onClick={() => disconnect()}
          className="flex items-center gap-2 px-3 py-1.5 bg-pulse-green/10 text-pulse-green text-[12px] font-medium rounded-lg border border-pulse-green/20 hover:bg-pulse-green/20 transition-all"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-pulse-green" />
          {address.slice(0, 6)}...{address.slice(-4)}
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-1.5 bg-pulse-green text-black text-[13px] font-semibold rounded-lg hover:bg-pulse-green/90 active:scale-[0.97] transition-all"
      >
        Connect
      </button>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative w-[360px] bg-[#1c1c1e] border border-white/[0.08] rounded-2xl p-6 shadow-2xl animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-[16px] font-semibold text-white">Connect Wallet</h3>
                <p className="text-[12px] text-text-tertiary mt-0.5">Choose how to connect to KitePulse</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-text-tertiary hover:text-white transition-all"
              >
                ✕
              </button>
            </div>

            {/* Wallet Options — dynamic from connectors */}
            <div className="space-y-2">
              {connectors.map((connector) => (
                <button
                  key={connector.id}
                  onClick={() => handleConnect(connector)}
                  disabled={isPending}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.12] transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center text-[18px]">
                    {WALLET_ICONS[connector.id] || "👛"}
                  </div>
                  <div className="text-left flex-1">
                    <div className="text-[13px] font-medium text-white group-hover:text-pulse-green transition-colors">
                      {connector.name}
                    </div>
                    <div className="text-[11px] text-text-tertiary">
                      {WALLET_DESCRIPTIONS[connector.id] || "Connect with " + connector.name}
                    </div>
                  </div>
                  <div className="text-text-tertiary text-[14px]">→</div>
                </button>
              ))}
            </div>

            {/* Pending */}
            {isPending && (
              <div className="mt-4 flex items-center justify-center gap-2 text-[12px] text-pulse-green">
                <div className="w-3 h-3 border-2 border-pulse-green/30 border-t-pulse-green rounded-full animate-spin" />
                Connecting...
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-[12px] text-red-400">
                {error.message.includes("User rejected")
                  ? "Connection rejected. Try again."
                  : error.message.includes("install")
                    ? "No wallet detected. Install MetaMask or another wallet."
                    : error.message.slice(0, 150)}
              </div>
            )}

            {/* Footer */}
            <div className="mt-5 pt-4 border-t border-white/[0.06] text-center">
              <p className="text-[11px] text-text-tertiary">
                New to crypto?{" "}
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pulse-green hover:underline"
                >
                  Get a wallet →
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
