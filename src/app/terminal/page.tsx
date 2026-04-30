"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { PULSE_SCORE_ADDRESS, PULSE_SCORE_ABI, USDC_ADDRESS, ERC20_ABI, USDC_DECIMALS, kiteTestnet, publicClient } from "@/lib/web3";
import { useRealChainId } from "@/hooks/useRealChainId";
import { useAAWallet } from "@/hooks/useAAWallet";
import { useMounted } from "@/hooks/useMounted";
import AAWalletPanel from "@/components/AAWalletPanel";
import {
  encodeRegisterAgent,
  encodeRequestService,
  encodeSettlePayment,
  encodeApproveUSDC,
  encodeRefreshSession,
} from "@/lib/aa-sdk";

const USDCD = 10 ** USDC_DECIMALS;

interface LogEntry {
  id: string;
  type: "in" | "out" | "sys" | "tx" | "err";
  text: string;
  timestamp: string;
}

export default function Terminal() {
  const { address, isConnected, connector } = useAccount();
  const realChainId = useRealChainId();
  const isWrongChain = realChainId !== undefined && realChainId !== kiteTestnet.id;
  const mounted = useMounted();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const nextLogId = useCallback(() => {
    return `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }, []);

  const aa = useAAWallet();
  const canonicalAddress = aa.canonicalAddress;

  // Contract reads — always against canonical (AA) address
  const ca = canonicalAddress as `0x${string}` | null;
  const { data: agent, refetch: refetchAgent } = useReadContract({
    address: PULSE_SCORE_ADDRESS,
    abi: PULSE_SCORE_ABI,
    functionName: "getAgent",
    args: ca ? [ca] : undefined,
    query: { enabled: !!ca },
  });
  const { data: serviceCount } = useReadContract({
    address: PULSE_SCORE_ADDRESS,
    abi: PULSE_SCORE_ABI,
    functionName: "getServiceCount",
  });
  const { data: sessionRemaining, refetch: refetchSession } = useReadContract({
    address: PULSE_SCORE_ADDRESS,
    abi: PULSE_SCORE_ABI,
    functionName: "getSessionRemaining",
    args: ca ? [ca] : undefined,
    query: { enabled: !!ca },
  });

  // Only normal tx hook left: fund-aa (EOA → AA wallet USDC transfer)
  const { writeContract: writeTransfer, data: xferHash, isPending: xferPending } = useWriteContract();
  const { isLoading: xferConfirming } = useWaitForTransactionReceipt({ hash: xferHash });

  const addLog = useCallback((type: LogEntry["type"], text: string) => {
    setLogs((prev) => [...prev, {
      id: nextLogId(),
      type,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    }]);
  }, [nextLogId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Boot sequence on mount
  useEffect(() => {
    addLog("sys", "Sibyl Agent Runtime v2.0.0");
    addLog("sys", "Type 'help' for available commands.");
    if (!isConnected) {
      addLog("err", "No wallet connected. Connect via top-right button.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Gasless tx status
  useEffect(() => {
    if (aa.lastTxStatus === "success" && aa.lastTxHash) {
      addLog("tx", `Gasless tx confirmed. Hash: ${aa.lastTxHash.slice(0, 10)}...`);
      refetchAgent();
      refetchSession();
      aa.resetStatus();
    }
    if (aa.lastTxStatus === "error" && aa.lastTxError) {
      addLog("err", `Gasless failed: ${aa.lastTxError.slice(0, 120)}`);
      aa.resetStatus();
    }
  }, [aa.lastTxStatus, aa.lastTxHash, aa.lastTxError, addLog, aa, refetchAgent, refetchSession]);

  useEffect(() => {
    if (xferHash && !xferPending && !xferConfirming) addLog("tx", `USDC transferred to AA. Tx: ${xferHash.slice(0, 10)}...`);
  }, [xferHash, xferPending, xferConfirming, addLog]);

  const getServices = useCallback(async () => {
    if (!serviceCount) return [];
    const count = Number(serviceCount);
    try {
      const calls = Array.from({ length: count }, (_, i) => ({
        address: PULSE_SCORE_ADDRESS,
        abi: PULSE_SCORE_ABI,
        functionName: "getService" as const,
        args: [BigInt(i + 1)],
      }));
      const results = await publicClient.multicall({ contracts: calls });
      const services = results
        .map((res, i) => {
          if (res.status !== "success") return null;
          const s = res.result as any;
          return {
            id: i + 1,
            name: s.name as string,
            provider: (s.provider as string).toLowerCase(),
            price: BigInt(s.price),
            minScore: Number(s.minScore),
          };
        })
        .filter(Boolean) as { id: number; name: string; provider: string; price: bigint; minScore: number }[];
      // Filter out user's own services (can't request self)
      const ownAddr = canonicalAddress?.toLowerCase() || "";
      return services.filter((s) => s.provider !== ownAddr);
    } catch {
      return Array.from({ length: count }, (_, i) => ({
        id: i + 1,
        name: `Service #${i + 1}`,
        provider: "",
        price: 0n,
        minScore: 0,
      }));
    }
  }, [serviceCount, canonicalAddress]);

  const signUserOp = useCallback(async (userOpHash: string): Promise<string> => {
    if (!address) throw new Error("Wallet not available");
    const provider = (await connector?.getProvider()) as any;
    if (!provider) throw new Error("Wallet provider not available. Try reconnecting your wallet.");
    const signature = await provider.request({
      method: "personal_sign",
      params: [userOpHash, address],
    });
    return signature;
  }, [connector, address]);

  const handleCommand = async (cmd: string, args: string[]) => {
    if (!isConnected) {
      addLog("err", "Wallet not connected.");
      return;
    }
    if (isWrongChain) {
      addLog("err", `Wrong network. Switch to Kite Testnet (ID: ${kiteTestnet.id}).`);
      return;
    }
    if (!canonicalAddress) {
      addLog("err", "AA wallet not ready. Wait a moment and retry.");
      return;
    }

    switch (cmd) {
      case "help":
        addLog("sys", "AVAILABLE COMMANDS:");
        addLog("out", "  register           — Register AA wallet as agent onchain");
        addLog("out", "  status             — Show agent score, balance, session");
        addLog("out", "  discover           — List available agent services");
        addLog("out", "  request <id>       — Request a service (x402 step 1)");
        addLog("out", "  settle <id>        — Settle payment (x402 step 2)");
        addLog("out", "  approve <amount>   — Approve USDC for PulseScore from AA wallet");
        addLog("out", "  approve max        — Approve unlimited USDC for PulseScore");
        addLog("out", "  fund-aa <amount>   — Send USDC from EOA to AA wallet");
        addLog("out", "  refresh            — Refresh session budget");
        addLog("out", "  mcp                — Show MCP server info for AI agents");
        addLog("out", "  clear              — Clear terminal");
        addLog("sys", "All onchain operations are gasless ERC-4337 UserOperations.");
        if (!agent?.exists) {
          addLog("sys", "TIP: Run 'register' first to create your agent identity.");
        }
        break;

      case "register":
        addLog("sys", "Registering AA wallet as agent onchain...");
        try {
          const result = await aa.sendGaslessTx(
            { target: PULSE_SCORE_ADDRESS, callData: encodeRegisterAgent(canonicalAddress) },
            signUserOp
          );
          if (result.status === "success" && result.userOpHash) {
            addLog("sys", "Agent registered. AA wallet is now the owner.");
            addLog("out", `  UserOp Hash: ${result.userOpHash}`);
            addLog("out", `  Explorer:    https://testnet.kitescan.ai/tx/${result.userOpHash}`);
            addLog("sys", "Next: Run 'approve max' to let PulseScore spend your AA wallet's USDC.");
            await refetchAgent();
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          addLog("err", `Registration failed: ${msg.slice(0, 200)}`);
          if (msg.includes("AA33") || msg.includes("reverted")) {
            addLog("err", "Paymaster rejected the transaction. Fund your AA wallet with KITE or USDC.");
            if (aa.aaAddress) {
              addLog("sys", `Fund your AA wallet: ${aa.aaAddress}`);
              addLog("out", `  https://testnet.kitescan.ai/address/${aa.aaAddress}`);
            }
          }
        }
        break;

      case "status":
        if (!agent) {
          addLog("err", "Agent not registered. Run 'register' first.");
          return;
        }
        addLog("sys", "AGENT STATUS:");
        addLog("out", `  Score:      ${agent.score} [${agent.score >= 800 ? "Elite" : agent.score >= 600 ? "Reliable" : agent.score >= 400 ? "Trusted" : agent.score >= 200 ? "Newcomer" : "Unverified"}]`);
        addLog("out", `  TX Count:   ${agent.totalTxns}`);
        addLog("out", `  Total Spent: $${(Number(agent.totalSpent) / USDCD).toFixed(4)} USDC`);
        addLog("out", `  Session:    $${sessionRemaining ? (Number(sessionRemaining) / USDCD).toFixed(4) : "0"} remaining`);
        if (aa.aaAddress) {
          addLog("out", `  AA Wallet:  ${aa.aaAddress}`);
          addLog("out", `  Fund link:  https://testnet.kitescan.ai/address/${aa.aaAddress}`);
        }
        break;

      case "discover": {
        const svcs = await getServices();
        if (svcs.length === 0) {
          addLog("err", "No services found.");
          return;
        }
        addLog("sys", `AGENT SERVICE REGISTRY (${svcs.length} services):`);
        addLog("out", "Use 'request <id>' then 'settle <id>' to consume.");
        svcs.forEach((s) => addLog("out", `  [#${s.id}] ${s.name}`));
        break;
      }

      case "request": {
        const id = parseInt(args[0], 10);
        if (!id || isNaN(id)) { addLog("err", "Usage: request <service_id>"); return; }
        addLog("sys", `Requesting service #${id} via gasless AA...`);
        try {
          const result = await aa.sendGaslessTx(
            { target: PULSE_SCORE_ADDRESS, callData: encodeRequestService(BigInt(id), canonicalAddress) },
            signUserOp
          );
          if (result.status === "success" && result.userOpHash) {
            addLog("sys", `Service #${id} requested.`);
            addLog("out", `  UserOp Hash: ${result.userOpHash}`);
            addLog("out", `  Explorer:    https://testnet.kitescan.ai/tx/${result.userOpHash}`);
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          addLog("err", `Request failed: ${msg.slice(0, 200)}`);
          if (msg.includes("AA33") || msg.includes("reverted")) {
            addLog("err", "Paymaster rejected the transaction. Fund your AA wallet with KITE or USDC.");
            if (aa.aaAddress) {
              addLog("sys", `Fund your AA wallet: ${aa.aaAddress}`);
              addLog("out", `  https://testnet.kitescan.ai/address/${aa.aaAddress}`);
            }
          }
        }
        break;
      }

      case "settle": {
        const id = parseInt(args[0], 10);
        if (!id || isNaN(id)) { addLog("err", "Usage: settle <service_id>"); return; }
        addLog("sys", `Settling payment for service #${id} via gasless AA...`);
        try {
          const result = await aa.sendGaslessTx(
            { target: PULSE_SCORE_ADDRESS, callData: encodeSettlePayment(BigInt(id), canonicalAddress, true) },
            signUserOp
          );
          if (result.status === "success" && result.userOpHash) {
            addLog("sys", `Payment settled for service #${id}.`);
            addLog("out", `  UserOp Hash: ${result.userOpHash}`);
            addLog("out", `  Explorer:    https://testnet.kitescan.ai/tx/${result.userOpHash}`);
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          addLog("err", `Settle failed: ${msg.slice(0, 200)}`);
          if (msg.includes("AA33") || msg.includes("reverted")) {
            addLog("err", "Paymaster rejected the transaction. Fund your AA wallet with KITE or USDC.");
            if (aa.aaAddress) {
              addLog("sys", `Fund your AA wallet: ${aa.aaAddress}`);
              addLog("out", `  https://testnet.kitescan.ai/address/${aa.aaAddress}`);
            }
          }
        }
        break;
      }

      case "approve": {
        if (args[0] === "max") {
          const maxAmount = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
          addLog("sys", "Approving unlimited USDC via gasless AA...");
          try {
            const result = await aa.sendGaslessTx(
              { target: USDC_ADDRESS, callData: encodeApproveUSDC(PULSE_SCORE_ADDRESS, maxAmount) },
              signUserOp
            );
            if (result.status === "success" && result.userOpHash) {
              addLog("sys", "Unlimited USDC approved.");
              addLog("out", `  UserOp Hash: ${result.userOpHash}`);
              addLog("out", `  Explorer:    https://testnet.kitescan.ai/tx/${result.userOpHash}`);
            }
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            addLog("err", `Approve failed: ${msg.slice(0, 200)}`);
            if (msg.includes("AA33")) {
              addLog("err", "Paymaster underfunded. Fund your AA wallet with KITE or USDC.");
              if (aa.aaAddress) addLog("out", `  https://testnet.kitescan.ai/address/${aa.aaAddress}`);
            }
          }
        } else {
          const amount = parseFloat(args[0]);
          if (!amount || isNaN(amount)) { addLog("err", "Usage: approve <amount_in_usdc> OR approve max"); return; }
          const raw = BigInt(Math.round(amount * USDCD));
          addLog("sys", `Approving ${amount} USDC via gasless AA...`);
          try {
            const result = await aa.sendGaslessTx(
              { target: USDC_ADDRESS, callData: encodeApproveUSDC(PULSE_SCORE_ADDRESS, raw) },
              signUserOp
            );
            if (result.status === "success" && result.userOpHash) {
              addLog("sys", `${amount} USDC approved.`);
              addLog("out", `  UserOp Hash: ${result.userOpHash}`);
              addLog("out", `  Explorer:    https://testnet.kitescan.ai/tx/${result.userOpHash}`);
            }
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            addLog("err", `Approve failed: ${msg.slice(0, 200)}`);
            if (msg.includes("AA33")) {
              addLog("err", "Paymaster underfunded. Fund your AA wallet with KITE or USDC.");
              if (aa.aaAddress) addLog("out", `  https://testnet.kitescan.ai/address/${aa.aaAddress}`);
            }
          }
        }
        break;
      }

      case "fund-aa": {
        if (!aa.aaAddress) { addLog("err", "AA wallet not available. Connect wallet first."); return; }
        if (!address) { addLog("err", "No wallet connected."); return; }
        const amount = parseFloat(args[0]);
        if (!amount || isNaN(amount) || amount <= 0) { addLog("err", "Usage: fund-aa <amount_in_usdc>"); return; }
        const raw = BigInt(Math.round(amount * USDCD));
        addLog("sys", `Transferring ${amount} USDC to AA wallet ${aa.aaAddress}...`);
        addLog("out", `  From: ${address}`);
        addLog("out", `  To:   ${aa.aaAddress}`);
        writeTransfer({ address: USDC_ADDRESS, abi: ERC20_ABI, functionName: "transfer", args: [aa.aaAddress as `0x${string}`, raw] });
        break;
      }

      case "refresh":
        addLog("sys", "Refreshing session via gasless AA...");
        try {
          const result = await aa.sendGaslessTx(
            { target: PULSE_SCORE_ADDRESS, callData: encodeRefreshSession() },
            signUserOp
          );
          if (result.status === "success" && result.userOpHash) {
            addLog("sys", "Session refreshed.");
            addLog("out", `  UserOp Hash: ${result.userOpHash}`);
            addLog("out", `  Explorer:    https://testnet.kitescan.ai/tx/${result.userOpHash}`);
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          addLog("err", `Refresh failed: ${msg.slice(0, 200)}`);
          if (msg.includes("AA33")) {
            addLog("err", "Paymaster underfunded. Fund your AA wallet with KITE or USDC.");
            if (aa.aaAddress) addLog("out", `  https://testnet.kitescan.ai/address/${aa.aaAddress}`);
          }
        }
        break;

      case "mcp":
        addLog("sys", "MCP SERVER (Model Context Protocol):");
        addLog("out", "  Endpoint: /api/mcp");
        addLog("out", "  Tools: get_agent_status, list_services, get_service");
        addLog("out", "  Docs: https://modelcontextprotocol.io");
        addLog("out", "  AI agents can query reputation and discover services via this API.");
        break;

      case "clear":
        setLogs([]);
        break;

      default:
        addLog("err", `Unknown command: ${cmd}. Type 'help' for available commands.`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const parts = input.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);
    addLog("in", input);
    setInput("");
    handleCommand(cmd, args);
  };

  const getLineColor = (type: LogEntry["type"]) => {
    switch (type) {
      case "in": return "text-neon-green";
      case "out": return "text-text-secondary";
      case "sys": return "text-text-tertiary";
      case "tx": return "text-neon-cyan";
      case "err": return "text-danger";
      default: return "text-text-primary";
    }
  };

  const getPrefix = (type: LogEntry["type"]) => {
    switch (type) {
      case "in": return ">>>";
      case "out": return "<<<";
      case "sys": return "[*]";
      case "tx": return "[$]";
      case "err": return "[✕]";
      default: return "   ";
    }
  };

  return (
    <div style={{ padding: "96px 32px 48px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

        {/* AA Wallet Panel */}
        <AAWalletPanel />

        {/* Header */}
        <div className="mb-10 fade-in">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-neon-green text-xs font-bold">[</span>
            <span className="text-xs font-bold tracking-widest text-text-secondary">AGENT_TERMINAL</span>
            <span className="text-neon-green text-xs font-bold">]</span>
          </div>
          <p className="text-text-secondary text-sm leading-relaxed max-w-2xl">
            Live CLI for the Kite agentic economy. All onchain operations are gasless ERC-4337 UserOperations.
          </p>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setLogs([])}
              className="px-4 py-2 text-[11px] font-bold tracking-wider border border-border text-text-secondary hover:text-neon-green hover:border-neon-green/40 transition-all"
            >
              [ CLEAR ]
            </button>
          </div>
        </div>

        {/* Terminal Window */}
        <div className="fade-in" style={{ animationDelay: "0.1s" }}>
          <div
            style={{
              background: "rgba(5,5,5,0.98)",
              border: "1px solid #222",
              borderTop: "2px solid #00ff41",
              height: "600px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface-raised">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-text-tertiary font-bold tracking-wider">AGENT_SESSION</span>
                <span className={`text-[10px] ${mounted && isConnected && !isWrongChain ? "text-neon-green" : "text-danger"}`}>
                  {mounted ? (isConnected && !isWrongChain ? "● ONLINE" : "● OFFLINE") : "● ..."}
                </span>
                <span className="text-[10px] text-neon-yellow font-bold tracking-wider">⚡ GASLESS</span>
              </div>
              <span className="text-[10px] text-text-tertiary font-mono">
                {mounted && isConnected && canonicalAddress ? `${canonicalAddress.slice(0, 6)}...${canonicalAddress.slice(-4)}` : "not connected"} :: {mounted ? (realChainId ?? "?") : "?"}
              </span>
            </div>

            {/* Logs */}
            <div className="flex-1 overflow-y-auto p-4 font-mono text-[12px] leading-relaxed space-y-1">
              {logs.map((log) => (
                <div key={log.id} className={`flex gap-2 ${getLineColor(log.type)}`}>
                  <span className="text-text-tertiary shrink-0">{log.timestamp}</span>
                  <span className="font-bold shrink-0">{getPrefix(log.type)}</span>
                  <span>{log.text}</span>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 px-4 py-3 border-t border-border bg-surface-raised"
            >
              <span className="text-neon-green font-bold text-[12px]">{'>'}</span>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isConnected ? "Enter command..." : "Connect wallet to use CLI"}
                disabled={!isConnected}
                className="flex-1 bg-transparent text-[12px] text-text-primary font-mono focus:outline-none disabled:opacity-40"
                autoFocus
              />
            </form>
          </div>
        </div>

        {/* Quick Reference Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10 fade-in" style={{ animationDelay: "0.2s" }}>
          <div style={{ padding: "20px", background: "rgba(10,10,10,0.85)", border: "1px solid #222" }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-neon-green text-lg">📝</span>
              <span className="text-[12px] font-bold text-text-primary">REGISTER</span>
            </div>
            <code className="block text-[10px] text-neon-cyan font-mono bg-surface-raised p-2 border border-border mb-2">
              register
            </code>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              Create onchain agent identity for your AA wallet. Grants $100 session budget.
            </p>
          </div>

          <div style={{ padding: "20px", background: "rgba(10,10,10,0.85)", border: "1px solid #222" }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-neon-cyan text-lg">🔍</span>
              <span className="text-[12px] font-bold text-text-primary">DISCOVER</span>
            </div>
            <code className="block text-[10px] text-neon-cyan font-mono bg-surface-raised p-2 border border-border mb-2">
              discover
            </code>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              Browse agent services. Filter by reputation tier and price.
            </p>
          </div>

          <div style={{ padding: "20px", background: "rgba(10,10,10,0.85)", border: "1px solid #222" }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-neon-yellow text-lg">💰</span>
              <span className="text-[12px] font-bold text-text-primary">SETTLE</span>
            </div>
            <code className="block text-[10px] text-neon-cyan font-mono bg-surface-raised p-2 border border-border mb-2">
              request 1<br/>settle 1
            </code>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              x402 two-step: request service, then settle USDC payment. Fully gasless.
            </p>
          </div>
        </div>

        {/* Gasless Info Card */}
        <div className="fade-in mt-6" style={{ animationDelay: "0.3s", padding: "20px", background: "rgba(10,10,10,0.85)", border: "1px solid #222" }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-neon-yellow text-lg">⚡</span>
            <span className="text-[12px] font-bold text-text-primary">ERC-4337 GASLESS ARCHITECTURE</span>
          </div>
          <p className="text-[11px] text-text-secondary leading-relaxed mb-3">
            All contract interactions are sent as UserOperations through the Kite bundler.
            Your EOA wallet only signs — no native KITE gas required. The AA wallet is your agent identity.
          </p>
          <div className="flex gap-2 flex-wrap">
            <span className="text-[10px] text-text-tertiary border border-border px-2 py-1">AA Wallet: Deterministic per EOA</span>
            <span className="text-[10px] text-text-tertiary border border-border px-2 py-1">Bundler: staging.gokite.ai</span>
            <span className="text-[10px] text-text-tertiary border border-border px-2 py-1">EntryPoint: 0x4337...f108</span>
          </div>
        </div>
      </div>
    </div>
  );
}
