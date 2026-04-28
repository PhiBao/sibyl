"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";

export default function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <button
        onClick={() => disconnect()}
        className="flex items-center gap-2 px-3 py-1.5 bg-pulse-green/10 text-pulse-green text-[12px] font-medium rounded-lg border border-pulse-green/20 hover:bg-pulse-green/20 transition-all"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-pulse-green" />
        {address.slice(0, 6)}...{address.slice(-4)}
      </button>
    );
  }

  return (
    <button
      onClick={() => {
        const injected = connectors.find((c) => c.id === "injected");
        if (injected) connect({ connector: injected });
      }}
      className="px-4 py-1.5 bg-pulse-green text-black text-[13px] font-semibold rounded-lg hover:bg-pulse-green/90 transition-all"
    >
      Connect Wallet
    </button>
  );
}
