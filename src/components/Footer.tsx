export default function Footer() {
  return (
    <footer className="border-t border-border mt-20">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-neon-green animate-pulse" />
          <span className="text-[11px] text-text-tertiary font-bold tracking-wider">
            SIBYL v1.1.0
          </span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://testnet.kitescan.ai/address/0x4Cf4Ca414616Dad1CCc76015Ee24A5DB53f06b04"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-text-tertiary hover:text-neon-green transition-colors"
          >
            Contract
          </a>
          <a
            href="https://docs.gokite.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-text-tertiary hover:text-neon-green transition-colors"
          >
            Docs
          </a>
          <a
            href="https://www.encodeclub.com/programmes/kites-hackathon-ai-agentic-economy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-text-tertiary hover:text-neon-green transition-colors"
          >
            Encode Club
          </a>
        </div>
        <span className="text-[10px] text-text-tertiary">
          Built for Kite Hackathon — AI Agentic Economy
        </span>
      </div>
    </footer>
  );
}
