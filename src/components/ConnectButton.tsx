"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import type { Connector } from "wagmi";
import { kiteTestnet, USDC_ADDRESS, ERC20_ABI, USDC_DECIMALS } from "@/lib/web3";
import { useMounted } from "@/hooks/useMounted";
import { useRealChainId } from "@/hooks/useRealChainId";
import { useAAWallet } from "@/hooks/useAAWallet";

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
  const aa = useAAWallet();

  const [showModal, setShowModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [connError, setConnError] = useState<string | null>(null);
  const [fundAmount, setFundAmount] = useState("1");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { writeContract: writeTransfer, data: xferHash, isPending: xferPending } = useWriteContract();
  const { isLoading: xferConfirming } = useWaitForTransactionReceipt({ hash: xferHash });
  const isFunding = xferPending || xferConfirming;

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

  // Auto-switch to Kite testnet after connection
  useEffect(() => {
    if (!mounted || !isConnected || !chainId || chainId === kiteTestnet.id || !switchChain) return;
    const autoSwitch = async () => {
      try {
        await switchChain({ chainId: kiteTestnet.id });
      } catch (switchErr: unknown) {
        const msg = switchErr instanceof Error ? switchErr.message : String(switchErr);
        if (msg.includes("unrecognized") || msg.includes("chain") || msg.includes("wallet_add")) {
          const ethereum = (window as unknown as { ethereum?: { request: (args: unknown) => Promise<unknown> } }).ethereum;
          if (!ethereum) return;
          try {
            await ethereum.request({
              method: "wallet_addEthereumChain",
              params: [{
                chainId: `0x${kiteTestnet.id.toString(16)}`,
                chainName: kiteTestnet.name,
                nativeCurrency: kiteTestnet.nativeCurrency,
                rpcUrls: ["https://rpc-testnet.gokite.ai"],
                blockExplorerUrls: ["https://testnet.kitescan.ai"],
              }],
            });
            await switchChain({ chainId: kiteTestnet.id });
          } catch {
            // User rejected
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

  const copyAddress = async (addr: string) => {
    await navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFund = () => {
    if (!aa.aaAddress || !address) return;
    const amt = parseFloat(fundAmount);
    if (isNaN(amt) || amt <= 0) return;
    const raw = BigInt(Math.round(amt * 10 ** USDC_DECIMALS));
    writeTransfer({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [aa.aaAddress as `0x${string}`, raw],
    });
  };

  if (!mounted) {
    return <div className="h-7 w-24 border border-border bg-surface-raised animate-pulse" />;
  }

  const displayAddress = aa.aaAddress || address;
  const isAALoading = aa.isLoading;

  if (isConnected && displayAddress) {
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
            {isAALoading ? (
              <span className="font-mono">AA: computing...</span>
            ) : aa.aaAddress ? (
              <>
                <span className="hidden sm:inline font-mono">{aa.aaAddress.slice(0, 6)}...{aa.aaAddress.slice(-4)}</span>
                <span className="sm:hidden font-mono">{aa.aaAddress.slice(0, 4)}...{aa.aaAddress.slice(-2)}</span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline font-mono">{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "—"}</span>
                <span className="sm:hidden font-mono">{address ? `${address.slice(0, 4)}...${address.slice(-2)}` : "—"}</span>
              </>
            )}
            <span className="text-[10px] ml-1">▼</span>
          </button>

          {showDropdown && (
            <div
              className="absolute right-0 mt-2 w-64 z-[100]"
              style={{
                background: "rgba(10,10,10,0.95)",
                border: "1px solid #222",
                boxShadow: "0 0 12px rgba(0,255,65,0.08)",
              }}
            >
              {/* AA Wallet Section */}
              {aa.aaAddress && (
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-[10px] text-neon-green uppercase tracking-wider font-bold mb-1">AA Wallet (Agent)</p>
                  <p className="text-[11px] font-mono text-text-primary truncate">{aa.aaAddress}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={fundAmount}
                      onChange={(e) => setFundAmount(e.target.value)}
                      className="w-14 text-[10px] px-1 py-0.5 bg-transparent border border-border text-text-primary font-mono focus:outline-none focus:border-neon-green"
                    />
                    <button
                      onClick={handleFund}
                      disabled={isFunding}
                      className="text-[10px] px-2 py-0.5 border border-neon-green/40 text-neon-green hover:bg-neon-green/10 transition-colors disabled:opacity-50"
                    >
                      {isFunding ? "..." : "FUND USDC"}
                    </button>
                  </div>
                  {xferHash && !xferPending && !xferConfirming && (
                    <a
                      href={`https://testnet.kitescan.ai/tx/${xferHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-neon-green font-mono hover:underline block mt-1"
                    >
                      [ View Transfer ]
                    </a>
                  )}
                </div>
              )}

              {/* EOA Section */}
              <div className="px-4 py-3 border-b border-border">
                <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-bold mb-1">Signer (EOA)</p>
                <p className="text-[11px] font-mono text-text-secondary truncate">{address || "—"}</p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => { const addr = aa.aaAddress || address; if (addr) copyAddress(addr); setShowDropdown(false); }}
                  className="w-full text-left px-4 py-2.5 text-[12px] text-text-secondary hover:text-neon-green hover:bg-surface-raised transition-all flex items-center gap-2"
                >
                  <span>📋</span>
                  {copied ? "Copied!" : "Copy AA Address"}
                </button>
                <a
                  href={`https://testnet.kitescan.ai/address/${aa.aaAddress || address || ""}`}
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
