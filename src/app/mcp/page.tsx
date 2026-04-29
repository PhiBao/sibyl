"use client";

import { useState } from "react";
import { useMounted } from "@/hooks/useMounted";
import LoadingSpinner from "@/components/LoadingSpinner";

const TOOLS = [
  {
    name: "get_agent_status",
    description: "Get the on-chain reputation status of an agent wallet on Kite Chain",
    method: "POST",
    endpoint: "/api/mcp",
    example: `{
  "name": "get_agent_status",
  "arguments": {
    "address": "0x..."
  }
}`,
    response: `{
  "address": "0x...",
  "contract": "0x2824a4A5Dfa62E4F956358Fc2e2AE88175F6Af2b",
  "chainId": 2368,
  "rpcUrl": "https://rpc-testnet.gokite.ai",
  "method": "getAgent",
  "note": "Score is 0-1000. sessionBudget/sessionSpent are in USDC wei (18 decimals)."
}`,
  },
  {
    name: "list_services",
    description: "List all available agent services on the Sibyl Service Registry",
    method: "POST",
    endpoint: "/api/mcp",
    example: `{
  "name": "list_services",
  "arguments": {}
}`,
    response: `{
  "contract": "0x2824a4A5Dfa62E4F956358Fc2e2AE88175F6Af2b",
  "chainId": 2368,
  "rpcUrl": "https://rpc-testnet.gokite.ai",
  "countMethod": "getServiceCount",
  "readMethod": "getService",
  "note": "Loop from 1 to getServiceCount() and call getService(i) for each."
}`,
  },
  {
    name: "get_service",
    description: "Get details of a specific service by ID",
    method: "POST",
    endpoint: "/api/mcp",
    example: `{
  "name": "get_service",
  "arguments": {
    "serviceId": 1
  }
}`,
    response: `{
  "serviceId": 1,
  "contract": "0x2824a4A5Dfa62E4F956358Fc2e2AE88175F6Af2b",
  "chainId": 2368,
  "rpcUrl": "https://rpc-testnet.gokite.ai",
  "method": "getService",
  "args": [1],
  "note": "Price is in USDC wei (18 decimals). Divide by 1e18 for human-readable."
}`,
  },
];

export default function McpPage() {
  const mounted = useMounted();
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

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
            <span className="text-xs font-bold tracking-widest text-text-secondary">MODEL_CONTEXT_PROTOCOL</span>
            <span className="text-neon-green text-xs font-bold">]</span>
          </div>
          <p className="text-text-secondary text-sm" style={{ lineHeight: "1.7" }}>
            Sibyl exposes its on-chain reputation and service registry as AI-callable tools via the 
            <a href="https://modelcontextprotocol.io" target="_blank" rel="noopener noreferrer" className="text-neon-cyan hover:underline"> Model Context Protocol</a>.
            Any AI agent can query agent status, discover services, and evaluate reputation gates before initiating x402 payments.
          </p>
        </div>

        {/* Server Info Card */}
        <div className="fade-in mb-10" style={{ padding: "24px", background: "rgba(10,10,10,0.85)", border: "1px solid #222" }}>
          <div className="flex items-center gap-2 mb-5">
            <span className="text-neon-green text-xs font-bold">[</span>
            <span className="text-xs font-bold tracking-widest text-text-secondary">SERVER_INFO</span>
            <span className="text-neon-green text-xs font-bold">]</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-bold mb-1">Endpoint</p>
              <p className="text-[13px] font-mono text-neon-cyan">https://sibyl.vercel.app/api/mcp</p>
            </div>
            <div>
              <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-bold mb-1">Protocol Version</p>
              <p className="text-[13px] font-mono text-text-primary">2024-11-05</p>
            </div>
            <div>
              <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-bold mb-1">Contract</p>
              <p className="text-[13px] font-mono text-text-primary break-all">0x2824a4A5Dfa62E4F956358Fc2e2AE88175F6Af2b</p>
            </div>
            <div>
              <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-bold mb-1">Chain</p>
              <p className="text-[13px] font-mono text-text-primary">Kite AI Testnet (ID: 2368)</p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="fade-in mb-10" style={{ animationDelay: "0.1s", padding: "24px", background: "rgba(10,10,10,0.85)", border: "1px solid #222" }}>
          <div className="flex items-center gap-2 mb-5">
            <span className="text-neon-green text-xs font-bold">[</span>
            <span className="text-xs font-bold tracking-widest text-text-secondary">HOW_IT_WORKS</span>
            <span className="text-neon-green text-xs font-bold">]</span>
          </div>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="text-neon-green font-bold text-sm mt-0.5">01</div>
              <div>
                <p className="text-[13px] font-semibold text-text-primary mb-1">AI Agent Discovers Tools</p>
                <p className="text-[12px] text-text-secondary">Call <code className="text-neon-cyan font-mono text-[11px]">GET /api/mcp</code> to retrieve the tool manifest with input schemas and descriptions.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-neon-green font-bold text-sm mt-0.5">02</div>
              <div>
                <p className="text-[13px] font-semibold text-text-primary mb-1">Query On-Chain Data</p>
                <p className="text-[12px] text-text-secondary">Call <code className="text-neon-cyan font-mono text-[11px]">POST /api/mcp</code> with a tool name and arguments. The server returns contract calls the AI can execute via RPC.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-neon-green font-bold text-sm mt-0.5">03</div>
              <div>
                <p className="text-[13px] font-semibold text-text-primary mb-1">Evaluate Reputation Gates</p>
                <p className="text-[12px] text-text-secondary">Before purchasing a service, the AI checks <code className="text-neon-cyan font-mono text-[11px]">minScore</code> requirements and the buyer&apos;s current score to determine access.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-neon-green font-bold text-sm mt-0.5">04</div>
              <div>
                <p className="text-[13px] font-semibold text-text-primary mb-1">x402 Settlement</p>
                <p className="text-[12px] text-text-secondary">The AI initiates the two-step x402 flow via the Sibyl contract: <code className="text-neon-cyan font-mono text-[11px]">requestService</code> → approve USDC → <code className="text-neon-cyan font-mono text-[11px]">settlePayment</code>.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tools */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-neon-green text-xs font-bold">[</span>
            <span className="text-xs font-bold tracking-widest text-text-secondary">AVAILABLE_TOOLS</span>
            <span className="text-neon-green text-xs font-bold">]</span>
          </div>
          
          {TOOLS.map((tool, i) => (
            <div
              key={tool.name}
              className="fade-in"
              style={{ animationDelay: `${0.2 + i * 0.1}s`, padding: "24px", background: "rgba(10,10,10,0.85)", border: "1px solid #222" }}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-neon-cyan text-[10px] font-bold border border-neon-cyan/30 px-2 py-0.5">{tool.method}</span>
                <h3 className="text-[15px] font-bold text-text-primary">{tool.name}</h3>
              </div>
              <p className="text-[12px] text-text-secondary mb-5">{tool.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-text-tertiary uppercase tracking-wider font-bold">Request</span>
                    <button
                      onClick={() => copyToClipboard(tool.example, `${tool.name}-req`)}
                      className="text-[10px] text-neon-cyan hover:text-neon-green transition-colors"
                    >
                      {copied === `${tool.name}-req` ? "[ COPIED ]" : "[ COPY ]"}
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono text-text-secondary bg-[#0a0a0a] border border-border p-3 overflow-x-auto" style={{ maxHeight: "200px", overflow: "auto" }}>
                    <code>{tool.example}</code>
                  </pre>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-text-tertiary uppercase tracking-wider font-bold">Response</span>
                    <button
                      onClick={() => copyToClipboard(tool.response, `${tool.name}-res`)}
                      className="text-[10px] text-neon-cyan hover:text-neon-green transition-colors"
                    >
                      {copied === `${tool.name}-res` ? "[ COPIED ]" : "[ COPY ]"}
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono text-text-secondary bg-[#0a0a0a] border border-border p-3 overflow-x-auto" style={{ maxHeight: "200px", overflow: "auto" }}>
                    <code>{tool.response}</code>
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Integration Guide */}
        <div className="fade-in mt-10" style={{ animationDelay: "0.5s", padding: "24px", background: "rgba(10,10,10,0.85)", border: "1px solid #222" }}>
          <div className="flex items-center gap-2 mb-5">
            <span className="text-neon-green text-xs font-bold">[</span>
            <span className="text-xs font-bold tracking-widest text-text-secondary">INTEGRATION_GUIDE</span>
            <span className="text-neon-green text-xs font-bold">]</span>
          </div>
          <p className="text-[12px] text-text-secondary mb-4" style={{ lineHeight: "1.7" }}>
            To integrate Sibyl into your AI agent, configure the MCP client with the server endpoint.
            The agent will automatically discover available tools and their schemas.
          </p>
          <div className="bg-[#0a0a0a] border border-border p-4">
            <p className="text-[10px] text-text-tertiary uppercase tracking-wider font-bold mb-2">Claude / Cursor / Windsurf Config</p>
            <pre className="text-[11px] font-mono text-text-secondary overflow-x-auto">
              <code>{`{
  "mcpServers": {
    "sibyl": {
      "url": "https://sibyl.vercel.app/api/mcp"
    }
  }
}`}</code>
            </pre>
          </div>
        </div>

      </div>
    </div>
  );
}
