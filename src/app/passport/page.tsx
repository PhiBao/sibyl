"use client";

import { useMounted } from "@/hooks/useMounted";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function PassportPage() {
  const mounted = useMounted();

  if (!mounted) {
    return <LoadingSpinner text="INITIALIZING..." />;
  }

  return (
    <div className="min-h-screen" style={{ padding: "72px 32px 48px" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ marginBottom: "40px" }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-neon-green text-xs font-bold">[</span>
            <span className="text-xs font-bold tracking-widest text-text-secondary">KITE_AGENT_PASSPORT</span>
            <span className="text-neon-green text-xs font-bold">]</span>
          </div>
          <p className="text-text-secondary text-sm" style={{ lineHeight: "1.7" }}>
            Kite Agent Passport lets your AI agent discover and pay for services on your behalf.
            You stay in control of what it can spend — the agent handles everything else.
            Sibyl is fully compatible with the Kite Agent Passport ecosystem.
          </p>
        </div>

        {/* What is Passport */}
        <div className="fade-in mb-10" style={{ padding: "24px", background: "rgba(10,10,10,0.85)", border: "1px solid #222" }}>
          <div className="flex items-center gap-2 mb-5">
            <span className="text-neon-green text-xs font-bold">[</span>
            <span className="text-xs font-bold tracking-widest text-text-secondary">WHAT_IS_PASSPORT</span>
            <span className="text-neon-green text-xs font-bold">]</span>
          </div>
          <p className="text-[12px] text-text-secondary leading-relaxed mb-4">
            Agent Passport is Kite&apos;s end-to-end solution for AI agents to autonomously discover,
            negotiate, and pay for services. It combines passkey-based user approval with
            scoped spending sessions — so you approve the budget, and your agent handles the rest.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-border p-4 bg-surface-raised">
              <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-bold mb-2">Passkey Auth</p>
              <p className="text-[12px] text-text-secondary">Users approve spending sessions with device biometrics (Face ID, fingerprint, or hardware key).</p>
            </div>
            <div className="border border-border p-4 bg-surface-raised">
              <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-bold mb-2">Scoped Sessions</p>
              <p className="text-[12px] text-text-secondary">Each session has a budget, time limit, and scope. Agents work autonomously within limits.</p>
            </div>
            <div className="border border-border p-4 bg-surface-raised">
              <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-bold mb-2">Service Discovery</p>
              <p className="text-[12px] text-text-secondary">Agents search the Kite service catalog or use direct URLs to find and pay for capabilities.</p>
            </div>
            <div className="border border-border p-4 bg-surface-raised">
              <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-bold mb-2">Auto-Payment</p>
              <p className="text-[12px] text-text-secondary">Once a session is approved, the agent pays and receives results without further user input.</p>
            </div>
          </div>
        </div>

        {/* How Sibyl Works With Passport */}
        <div className="fade-in mb-10" style={{ animationDelay: "0.1s", padding: "24px", background: "rgba(10,10,10,0.85)", border: "1px solid #222" }}>
          <div className="flex items-center gap-2 mb-5">
            <span className="text-neon-green text-xs font-bold">[</span>
            <span className="text-xs font-bold tracking-widest text-text-secondary">SIBYL_X_PASSPORT</span>
            <span className="text-neon-green text-xs font-bold">]</span>
          </div>
          <p className="text-[12px] text-text-secondary leading-relaxed mb-5">
            Sibyl enhances the Passport experience with onchain reputation and x402 settlement.
            When your agent uses Sibyl through Passport, it benefits from:
          </p>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="text-neon-green font-bold text-sm mt-0.5">01</div>
              <div>
                <p className="text-[13px] font-semibold text-text-primary mb-1">Reputation-Gated Access</p>
                <p className="text-[12px] text-text-secondary">Passport agents with higher Sibyl scores unlock premium services automatically. No manual verification needed.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-neon-green font-bold text-sm mt-0.5">02</div>
              <div>
                <p className="text-[13px] font-semibold text-text-primary mb-1">x402 Micropayments</p>
                <p className="text-[12px] text-text-secondary">Sibyl&apos;s two-step payment flow (request → settle) integrates with Passport&apos;s session budget. Every payment updates your agent&apos;s score.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-neon-green font-bold text-sm mt-0.5">03</div>
              <div>
                <p className="text-[13px] font-semibold text-text-primary mb-1">Gasless via AA SDK</p>
                <p className="text-[12px] text-text-secondary">Sibyl supports Kite&apos;s ERC-4337 Account Abstraction SDK. Passport agents can execute gasless transactions through the bundler.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-neon-green font-bold text-sm mt-0.5">04</div>
              <div>
                <p className="text-[13px] font-semibold text-text-primary mb-1">MCP Tool Discovery</p>
                <p className="text-[12px] text-text-secondary">Sibyl exposes its reputation layer as MCP tools. Passport-enabled agents can query scores and discover services via the Model Context Protocol.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Install Passport */}
        <div className="fade-in mb-10" style={{ animationDelay: "0.2s", padding: "24px", background: "rgba(10,10,10,0.85)", border: "1px solid #222" }}>
          <div className="flex items-center gap-2 mb-5">
            <span className="text-neon-green text-xs font-bold">[</span>
            <span className="text-xs font-bold tracking-widest text-text-secondary">GET_STARTED</span>
            <span className="text-neon-green text-xs font-bold">]</span>
          </div>
          <p className="text-[12px] text-text-secondary leading-relaxed mb-5">
            Install Kite Agent Passport into your coding agent (Claude Code, Codex, Cursor, etc.)
            and connect it to the Sibyl reputation layer.
          </p>
          <div className="bg-[#0a0a0a] border border-border p-4 mb-5">
            <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-bold mb-2">Install Command</p>
            <code className="text-[11px] font-mono text-neon-cyan">curl -fsSL https://agentpassport.ai/install.sh | bash</code>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="https://docs.gokite.ai/kite-agent-passport/beginner-setup"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-[11px] font-bold tracking-wider border border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/10 transition-all text-center"
            >
              [ FULL SETUP GUIDE ]
            </a>
            <a
              href="https://docs.gokite.ai/kite-agent-passport/cli-reference"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-[11px] font-bold tracking-wider border border-border text-text-secondary hover:text-text-primary hover:border-text-secondary transition-all text-center"
            >
              [ CLI REFERENCE ]
            </a>
          </div>
        </div>

        {/* Architecture */}
        <div className="fade-in" style={{ animationDelay: "0.3s", padding: "24px", background: "rgba(10,10,10,0.85)", border: "1px solid #222" }}>
          <div className="flex items-center gap-2 mb-5">
            <span className="text-neon-green text-xs font-bold">[</span>
            <span className="text-xs font-bold tracking-widest text-text-secondary">ARCHITECTURE</span>
            <span className="text-neon-green text-xs font-bold">]</span>
          </div>
          <div className="flex justify-center">
            <pre
              className="text-[11px] text-text-secondary bg-[#0a0a0a] border border-border p-4 overflow-x-auto"
              style={{ fontFamily: "'JetBrains Mono', 'Courier New', monospace", lineHeight: 1.4, whiteSpace: "pre", display: "block", margin: "0 auto" }}
            >
              <code>{`+-----------------+
|   User Device   |
|  (Passkey Auth) |
+--------+--------+
         |
         v
+-----------------+
|  Kite Passport  |
| (Session Mgmt)  |
+--------+--------+
         |
         v
+-----------------+
|  Sibyl Agent    |
|  (Reputation)   |
+--------+--------+
         |
    +----+----+
    |         |
    v         v
+--------+  +--------+
| AA SDK |  |  x402  |
|Bundler |  |Settle  |
+--------+  +--------+
`}</code>
            </pre>
          </div>
        </div>

      </div>
    </div>
  );
}
