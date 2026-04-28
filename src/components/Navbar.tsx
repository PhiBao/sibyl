"use client";

import Link from "next/link";
import ConnectButton from "@/components/ConnectButton";
import { useAgentData } from "@/hooks/useAgentData";

export default function Navbar() {
  const { isConnected, exists, score } = useAgentData();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/[0.04]">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg bg-pulse-green/15 flex items-center justify-center border border-pulse-green/20">
            <div className="w-2 h-2 rounded-full bg-pulse-green pulse-ring" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight group-hover:text-pulse-green transition-colors">
            KitePulse
          </span>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-1">
          <Link href="/" className="px-3 py-1.5 text-[13px] text-text-secondary hover:text-text-primary rounded-lg hover:bg-white/[0.04] transition-all">
            Dashboard
          </Link>
          <Link href="/marketplace" className="px-3 py-1.5 text-[13px] text-text-secondary hover:text-text-primary rounded-lg hover:bg-white/[0.04] transition-all">
            Marketplace
          </Link>
          <Link href="/profile" className="px-3 py-1.5 text-[13px] text-text-secondary hover:text-text-primary rounded-lg hover:bg-white/[0.04] transition-all">
            Profile
          </Link>
          <div className="w-px h-5 bg-white/10 mx-2" />
          {isConnected && exists && (
            <span className="text-[11px] text-text-tertiary mr-2">
              Score: <span className="text-pulse-green font-medium">{score}</span>
            </span>
          )}
          <ConnectButton />
        </div>
      </div>
    </nav>
  );
}
