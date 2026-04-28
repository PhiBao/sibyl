import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KitePulse — Agent Reputation. On-Chain.",
  description: "Your agent's reputation. On-chain. Earned, not given.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="mesh-bg min-h-screen antialiased">
        <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/[0.04]">
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 rounded-lg bg-pulse-green/15 flex items-center justify-center border border-pulse-green/20">
                <div className="w-2 h-2 rounded-full bg-pulse-green pulse-ring" />
              </div>
              <span className="text-[15px] font-semibold tracking-tight group-hover:text-pulse-green transition-colors">KitePulse</span>
            </a>

            {/* Nav Links */}
            <div className="flex items-center gap-1">
              <a href="/" className="px-3 py-1.5 text-[13px] text-text-secondary hover:text-text-primary rounded-lg hover:bg-white/[0.04] transition-all">Dashboard</a>
              <a href="/marketplace" className="px-3 py-1.5 text-[13px] text-text-secondary hover:text-text-primary rounded-lg hover:bg-white/[0.04] transition-all">Marketplace</a>
              <a href="/profile" className="px-3 py-1.5 text-[13px] text-text-secondary hover:text-text-primary rounded-lg hover:bg-white/[0.04] transition-all">Profile</a>
              <div className="w-px h-5 bg-white/10 mx-2" />
              <button className="px-4 py-1.5 bg-pulse-green text-black text-[13px] font-semibold rounded-lg hover:bg-pulse-green/90 transition-all">
                Connect Passport
              </button>
            </div>
          </div>
        </nav>
        <main className="pt-14">
          {children}
        </main>
      </body>
    </html>
  );
}
