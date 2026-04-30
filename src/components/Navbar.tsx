"use client";

import { useState } from "react";
import Link from "next/link";
import ConnectButton from "@/components/ConnectButton";
import { useAgentData } from "@/hooks/useAgentData";
import { useAAWallet } from "@/hooks/useAAWallet";

const NAV_ITEMS = [
  { href: "/", label: "DASHBOARD" },
  { href: "/marketplace", label: "SERVICES" },
  { href: "/terminal", label: "TERMINAL" },
  { href: "/mcp", label: "MCP" },
  { href: "/passport", label: "PASSPORT" },
  { href: "/profile", label: "PROFILE" },
  { href: "/faucet", label: "FAUCET" },
];

export default function Navbar() {
  const aa = useAAWallet();
  const { isConnected, exists, score } = useAgentData(aa.canonicalAddress as `0x${string}`);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, borderBottom: "1px solid #222", background: "#050505" }}>
      {/* Desktop */}
      <div 
        className="hidden md:flex items-center"
        style={{ 
          maxWidth: "1200px", 
          margin: "0 auto", 
          padding: "0 32px", 
          height: "56px",
          justifyContent: "space-between"
        }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 border border-neon-green/40 flex items-center justify-center bg-surface-raised">
            <div className="w-2 h-2 bg-neon-green animate-pulse" />
          </div>
          <span className="text-[14px] font-bold tracking-wider text-text-primary group-hover:text-neon-green transition-colors">
            SIBYL
          </span>
        </Link>

        {/* Center Nav */}
        <div className="flex items-center" style={{ gap: "4px", position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-4 py-1.5 text-[11px] font-bold tracking-wider text-text-tertiary hover:text-neon-green border border-transparent hover:border-neon-green/30 transition-all"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center" style={{ gap: "12px" }}>
          {isConnected && exists && (
            <span className="text-[11px] text-text-tertiary font-mono border border-border px-2.5 py-1">
              SCORE:<span className="text-neon-green font-bold ml-1">{score}</span>
            </span>
          )}
          <ConnectButton />
        </div>
      </div>

      {/* Mobile */}
      <div 
        className="md:hidden flex items-center justify-between"
        style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px", height: "56px" }}
      >
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 border border-neon-green/40 flex items-center justify-center bg-surface-raised">
            <div className="w-2 h-2 bg-neon-green animate-pulse" />
          </div>
          <span className="text-[14px] font-bold tracking-wider text-text-primary group-hover:text-neon-green transition-colors">
            SIBYL
          </span>
        </Link>
        <div className="flex items-center" style={{ gap: "8px" }}>
          {isConnected && exists && (
            <span className="text-[10px] text-text-tertiary font-mono border border-border px-1.5 py-0.5">
              S:<span className="text-neon-green font-bold">{score}</span>
            </span>
          )}
          <ConnectButton />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="w-8 h-8 flex items-center justify-center border border-border text-text-tertiary hover:text-neon-green hover:border-neon-green/40 transition-all"
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-[#050505]" style={{ padding: "12px 24px" }}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 text-[11px] font-bold tracking-wider text-text-tertiary hover:text-neon-green hover:bg-surface-raised border border-transparent hover:border-neon-green/20 transition-all"
            >
              {`>`} {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
