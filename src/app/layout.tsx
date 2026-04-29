import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import NetworkGuard from "@/components/NetworkGuard";
import Footer from "@/components/Footer";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "Sibyl — Agent Reputation. On-Chain.",
  description: "Your agent's reputation. On-chain. Earned, not given.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="terminal-bg min-h-screen antialiased crt font-mono flex flex-col" suppressHydrationWarning>
        <Providers>
          <Navbar />
          <NetworkGuard />
          <main className="pt-20 flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
