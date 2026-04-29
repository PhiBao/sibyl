"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import type { Connector } from "wagmi";
import { kiteTestnet } from "@/lib/web3";
import { useMounted } from "@/hooks/useMounted";
import { useRealChainId } from "@/hooks/useRealChainId";

const WALLET_ICONS: Record<string, string> = {
  metaMaskSDK: "🦊",
  metaMask: "🦊",
  walletConnect: "🔗",
  coinbaseWalletSDK: "🔵",
  coinbaseWallet: "🔵",
  injected: "🌐",
};

export default function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const realChainId = useRealChainId();
  const { switchChain, error: switchError } = useSwitchChain();
  const mounted = useMounted();

  const [showModal, setShowModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [connError, setConnError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDropdown]);

  // Auto-switch to Kite testnet after connection — tries switch, then add network
  useEffect(() => {
    if (!mounted || !isConnected || !chainId || chainId === kiteTestnet.id || !switchChain) return;

    const autoSwitch = async () => {
      try {
        await switchChain({ chainId: kiteTestnet.id });
      } catch (switchErr: unknown) {
        const msg = switchErr instanceof Error ? switchErr.message : String(switchErr);
        // Chain not in wallet — try to add it
        if (msg.includes("unrecognized") || msg.includes("chain") || msg.includes("wallet_add")) {
          const ethereum = (window as unknown as { ethereum?: { request: (args: unknown) => Promise<unknown> } }).ethereum;
          if (!ethereum) return;
          try {
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
            // After adding, try to switch again
            await switchChain({ chainId: kiteTestnet.id });
          } catch {
            // User rejected add-network — NetworkGuard banner handles the rest
          }
        }
      }
    };

    autoSwitch();
  }, [mounted, isConnected, chainId, switchChain]);

  const getConnectorError = (connector: Connector, errMsg: string): string => {
    const name = connector.name;
    if (errMsg.includes("@metamask") || errMsg.includes("@walletconnect") || errMsg.includes("module") || errMsg.includes("Cannot find module")) {
      return `${name} module not found. Install the extension first.`;
    }
    if (errMsg.includes("install") || errMsg.includes("not found") || errMsg.includes("Provider") || errMsg.includes("not detected")) {
      return `${name} not detected. Install the wallet extension.`;
    }
    if (errMsg.includes("User rejected") || errMsg.includes("rejected")) {
      return "Connection rejected by user.";
    }
    return errMsg.slice(0, 150);
  };

  const handleConnect = (connector: Connector) => {
    setConnError(null);

    // Proactive check for MetaMask / injected wallets
    if (connector.id === "metaMask" || connector.id === "metaMaskSDK") {
      if (typeof window !== "undefined" && !(window as unknown as Record<string, unknown>).ethereum) {
        setConnError("MetaMask not detected. Install the extension from metamask.io");
        return;
      }
    }

    connect(
      { connector },
      {
        onSuccess: () => setShowModal(false),
        onError: (err) => setConnError(getConnectorError(connector, err.message)),
      }
    );
  };

  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!mounted) {
    return <div className="h-7 w-24 border border-border bg-surface-raised animate-pulse" />;
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        {realChainId !== undefined && realChainId !== kiteTestnet.id && (
          <button
            onClick={() => switchChain?.({ chainId: kiteTestnet.id })}
            className="px-2 py-1 text-[10px] font-bold tracking-wider border border-danger/40 text-danger hover:bg-danger/10 transition-all"
          >
            [ WRONG NET ]
          </button>
        )}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 border border-neon-green/30 text-neon-green text-[11px] font-bold tracking-wider hover:bg-neon-green/10 transition-all"
          >
            <span className="w-1.5 h-1.5 bg-neon-green animate-pulse" />
            <span className="hidden sm:inline font-mono">{address.slice(0, 6)}...{address.slice(-4)}</span>
            <span className="sm:hidden font-mono">{address.slice(0, 4)}...{address.slice(-2)}</span>
            <span className="text-[10px] ml-1">▼</span>
          </button>

          {showDropdown && (
            <div
              className="absolute right-0 mt-2 w-56 z-[100]"
              style={{
                background: "rgba(10,10,10,0.95)",
                border: "1px solid #222",
                boxShadow: "0 0 12px rgba(0,255,65,0.08)",
              }}
            >
              <div className="px-4 py-3 border-b border-border">
                <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-bold mb-1">Connected</p>
                <p className="text-[12px] font-mono text-neon-green truncate">{address}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => { copyAddress(); setShowDropdown(false); }}
                  className="w-full text-left px-4 py-2.5 text-[12px] text-text-secondary hover:text-neon-green hover:bg-surface-raised transition-all flex items-center gap-2"
                >
                  <span>📋</span>
                  {copied ? "Copied!" : "Copy Address"}
                </button>
                <a
                  href={`https://testnet.kitescan.ai/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full text-left px-4 py-2.5 text-[12px] text-text-secondary hover:text-neon-green hover:bg-surface-raised transition-all flex items-center gap-2"
                  onClick={() => setShowDropdown(false)}
                >
                  <span>🔗</span>
                  View on KiteScan
                </a>
                <button
                  onClick={() => { disconnect(); setShowDropdown(false); }}
                  className="w-full text-left px-4 py-2.5 text-[12px] text-danger hover:text-danger hover:bg-danger/10 transition-all flex items-center gap-2 border-t border-border mt-1"
                >
                  <span>🔌</span>
                  Disconnect
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => { setShowModal(true); setConnError(null); }}
        className="neon-btn-primary px-4 py-1.5 text-[11px] font-bold tracking-wider rounded-sm"
      >
        [ CONNECT ]
      </button>

      {showModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center px-4 py-10 overflow-y-auto">
          <div className="absolute inset-0 bg-black/90" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md fade-in mx-4" style={{ background: "rgba(10,10,10,0.95)", border: "1px solid rgba(0,255,65,0.4)", boxShadow: "0 0 12px rgba(0,255,65,0.08)" }}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-surface-raised">
              <div>
                <h3 className="text-sm font-bold tracking-wider text-neon-green">[ CONNECT_WALLET ]</h3>
                <p className="text-[11px] text-text-tertiary mt-0.5">Select interface module</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-7 h-7 flex items-center justify-center border border-border text-text-tertiary hover:text-neon-green hover:border-neon-green/40 transition-all"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-2">
              {connectors.map((connector) => (
                <button
                  key={connector.id}
                  onClick={() => handleConnect(connector)}
                  disabled={isPending}
                  className="w-full flex items-center gap-3 px-4 py-3 border border-border bg-surface hover:border-neon-green/40 hover:bg-surface-raised transition-all group text-left"
                >
                  <div className="w-9 h-9 border border-border flex items-center justify-center text-[16px] group-hover:border-neon-green/30">
                    {WALLET_ICONS[connector.id] || "👛"}
                  </div>
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold text-text-primary group-hover:text-neon-green transition-colors">
                      {connector.name.toUpperCase()}
                    </div>
                    <div className="text-[11px] text-text-tertiary">
                      {connector.id.includes("metaMask")
                        ? "Browser extension"
                        : connector.id.includes("walletConnect")
                          ? "QR scan protocol"
                          : connector.id.includes("coinbase")
                            ? "Coinbase interface"
                            : "Injected provider"}
                    </div>
                  </div>
                  <div className="text-text-tertiary text-xs group-hover:text-neon-green">{`>>`}</div>
                </button>
              ))}
            </div>

            {isPending && (
              <div className="px-4 pb-4 flex items-center justify-center gap-2 text-[11px] text-neon-green">
                <div className="w-3 h-3 border-2 border-neon-green/30 border-t-neon-green rounded-full animate-spin" />
                AUTHENTICATING...
              </div>
            )}

            {/* Connection errors */}
            {(connError || error || switchError) && (
              <div className="mx-4 mb-4 p-3 border border-danger/30 bg-danger/10 text-[11px] text-danger">
                {connError || getConnectorError(
                  connectors[0],
                  (error?.message || switchError?.message || "Connection failed")
                )}
              </div>
            )}

            <div className="px-4 py-3 border-t border-border bg-surface-raised text-center">
              <p className="text-[11px] text-text-tertiary">
                New to crypto?{" "}
                <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" className="text-neon-green hover:underline">
                  [ GET WALLET ]
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
