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
        <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-pulse-green/20 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-pulse-green pulse-ring" />
              </div>
              <span className="text-lg font-semibold tracking-tight">KitePulse</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="/" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Dashboard</a>
              <a href="/marketplace" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Marketplace</a>
              <a href="/profile" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Profile</a>
              <button className="px-4 py-2 bg-pulse-green/10 text-pulse-green text-sm font-medium rounded-full border border-pulse-green/20 hover:bg-pulse-green/20 transition-all">
                Connect Passport
              </button>
            </div>
          </div>
        </nav>
        <main className="pt-16">
          {children}
        </main>
      </body>
    </html>
  );
}
