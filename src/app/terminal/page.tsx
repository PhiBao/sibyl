"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useWalletClient } from "wagmi";
import { PULSE_SCORE_ADDRESS, PULSE_SCORE_ABI, USDC_ADDRESS, ERC20_ABI, USDC_DECIMALS, kiteTestnet } from "@/lib/web3";
import { useRealChainId } from "@/hooks/useRealChainId";
import { useAAWallet } from "@/hooks/useAAWallet";
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
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const realChainId = useRealChainId();
  const isWrongChain = realChainId !== undefined && realChainId !== kiteTestnet.id;
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [input, setInput] = useState("");
  const [running] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Bulletproof unique ID generator for log entries
  const nextLogId = useCallback(() => {
    return `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }, []);

  const aa = useAAWallet();

  // Contract reads
  const { data: agent } = useReadContract({
    address: PULSE_SCORE_ADDRESS,
    abi: PULSE_SCORE_ABI,
    functionName: "getAgent",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
  const { data: serviceCount } = useReadContract({
    address: PULSE_SCORE_ADDRESS,
    abi: PULSE_SCORE_ABI,
    functionName: "getServiceCount",
  });
  const { data: sessionRemaining } = useReadContract({
    address: PULSE_SCORE_ADDRESS,
    abi: PULSE_SCORE_ABI,
    functionName: "getSessionRemaining",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Writes (fallback when gasless is off)
  const { writeContract: writeRegister, data: regHash, isPending: regPending, error: regError } = useWriteContract();
  const { isLoading: regConfirming } = useWaitForTransactionReceipt({ hash: regHash });

  const { writeContract: writeRefresh, data: refHash, isPending: refPending } = useWriteContract();
  const { isLoading: refConfirming } = useWaitForTransactionReceipt({ hash: refHash });

  const { writeContract: writeRequest, data: reqHash, isPending: reqPending } = useWriteContract();
  const { isLoading: reqConfirming } = useWaitForTransactionReceipt({ hash: reqHash });

  const { writeContract: writeSettle, data: setHash, isPending: setPending } = useWriteContract();
  const { isLoading: setConfirming } = useWaitForTransactionReceipt({ hash: setHash });

  const { writeContract: writeApprove, data: appHash, isPending: appPending } = useWriteContract();
  const { isLoading: appConfirming } = useWaitForTransactionReceipt({ hash: appHash });

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

  // Respond to tx confirmations
  useEffect(() => {
    if (regHash && !regPending && !regConfirming) addLog("tx", `Agent registered. Tx: ${regHash.slice(0, 10)}...`);
  }, [regHash, regPending, regConfirming, addLog]);
  useEffect(() => {
    if (refHash && !refPending && !refConfirming) addLog("tx", `Session refreshed. Tx: ${refHash.slice(0, 10)}...`);
  }, [refHash, refPending, refConfirming, addLog]);
  useEffect(() => {
    if (reqHash && !reqPending && !reqConfirming) addLog("tx", `Service requested. Tx: ${reqHash.slice(0, 10)}...`);
  }, [reqHash, reqPending, reqConfirming, addLog]);
  useEffect(() => {
    if (setHash && !setPending && !setConfirming) addLog("tx", `Payment settled. Tx: ${setHash.slice(0, 10)}...`);
  }, [setHash, setPending, setConfirming, addLog]);
  useEffect(() => {
    if (appHash && !appPending && !appConfirming) addLog("tx", `USDC approved. Tx: ${appHash.slice(0, 10)}...`);
  }, [appHash, appPending, appConfirming, addLog]);
  useEffect(() => {
    if (regError) addLog("err", regError.message.slice(0, 120));
  }, [regError, addLog]);

  // Gasless tx status
  useEffect(() => {
    if (aa.lastTxStatus === "success" && aa.lastTxHash) {
      addLog("tx", `Gasless tx confirmed. Hash: ${aa.lastTxHash.slice(0, 10)}...`);
      aa.resetStatus();
    }
    if (aa.lastTxStatus === "error" && aa.lastTxError) {
      addLog("err", `Gasless failed: ${aa.lastTxError.slice(0, 120)}`);
      aa.resetStatus();
    }
  }, [aa.lastTxStatus, aa.lastTxHash, aa.lastTxError, addLog, aa]);

  const getServices = useCallback(async () => {
    if (!serviceCount) return [];
    const count = Number(serviceCount);
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      name: `Service #${i + 1}`,
    }));
  }, [serviceCount]);

  const signUserOp = useCallback(async (userOpHash: string): Promise<string> => {
    if (!walletClient || !address) throw new Error("Wallet not available");
    // Use personal_sign so the wallet applies the Ethereum message prefix
    // This matches what ethers.signMessage(bytes) does in the SDK example
    const signature = await (walletClient as any).request({
      method: "personal_sign",
      params: [userOpHash, address],
    });
    return signature;
  }, [walletClient, address]);

  const handleCommand = async (cmd: string, args: string[]) => {
    if (!isConnected) {
      addLog("err", "Wallet not connected.");
      return;
    }
    if (isWrongChain) {
      addLog("err", `Wrong network. Switch to Kite Testnet (ID: ${kiteTestnet.id}).`);
      return;
    }

    switch (cmd) {
      case "help":
        addLog("sys", "AVAILABLE COMMANDS:");
        addLog("out", "  register           — Register agent on-chain");
        addLog("out", "  status             — Show agent score, balance, session");
        addLog("out", "  discover           — List available agent services");
        addLog("out", "  request <id>       — Request a service (x402 step 1)");
        addLog("out", "  settle <id>        — Settle payment (x402 step 2)");
        addLog("out", "  approve <amount>   — Approve exact USDC spend");
        addLog("out", "  approve max        — Approve unlimited USDC (1 sig for all future)");
        addLog("out", "  refresh            — Refresh session budget");
        addLog("out", "  mcp                — Show MCP server info for AI agents");
        addLog("out", "  gasless            — Toggle ERC-4337 gasless mode");
        addLog("out", "  clear              — Clear terminal");
        if (aa.gaslessEnabled) {
          addLog("sys", "GASLESS MODE: ON — ERC-4337 UserOperations via Kite bundler");
          addLog("sys", "You still sign with your wallet, but no native KITE gas is needed.");
        } else {
          addLog("sys", "GASLESS MODE: OFF — Standard transactions (requires KITE gas)");
          addLog("sys", "TIP: Type 'gasless' to enable gasless mode.");
        }
        break;

      case "gasless":
        aa.toggleGasless();
        addLog("sys", `Gasless mode ${!aa.gaslessEnabled ? "ENABLED" : "DISABLED"}.`);
        if (!aa.gaslessEnabled) {
          addLog("sys", "ERC-4337 UserOperations will be sent via Kite bundler.");
          addLog("sys", `AA Wallet: ${aa.aaAddress?.slice(0, 10)}...${aa.aaAddress?.slice(-8)}`);
        }
        break;

      case "register":
        if (!address) { addLog("err", "No address"); return; }
        if (aa.gaslessEnabled) {
          addLog("sys", "Registering agent via gasless AA...");
          try {
            await aa.sendGaslessTx(
              { target: PULSE_SCORE_ADDRESS, callData: encodeRegisterAgent(address) },
              signUserOp
            );
          } catch (err: unknown) {
            addLog("err", `Gasless register failed: ${err instanceof Error ? err.message.slice(0, 120) : String(err)}`);
          }
        } else {
          addLog("sys", "Registering agent...");
          writeRegister({ address: PULSE_SCORE_ADDRESS, abi: PULSE_SCORE_ABI, functionName: "registerAgent", args: [address] });
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
          addLog("out", `  AA Wallet:  ${aa.aaAddress.slice(0, 10)}...${aa.aaAddress.slice(-8)} ${aa.gaslessEnabled ? "[GASLESS ACTIVE]" : "[GASLESS OFF]"}`);
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
        if (aa.gaslessEnabled) {
          addLog("sys", `Requesting service #${id} via gasless AA...`);
          try {
            await aa.sendGaslessTx(
              { target: PULSE_SCORE_ADDRESS, callData: encodeRequestService(BigInt(id)) },
              signUserOp
            );
          } catch (err: unknown) {
            addLog("err", `Gasless request failed: ${err instanceof Error ? err.message.slice(0, 120) : String(err)}`);
          }
        } else {
          addLog("sys", `Requesting service #${id} (x402 step 1)...`);
          writeRequest({ address: PULSE_SCORE_ADDRESS, abi: PULSE_SCORE_ABI, functionName: "requestService", args: [BigInt(id)] });
        }
        break;
      }

      case "settle": {
        const id = parseInt(args[0], 10);
        if (!id || isNaN(id)) { addLog("err", "Usage: settle <service_id>"); return; }
        if (!address) { addLog("err", "No address"); return; }
        if (aa.gaslessEnabled) {
          addLog("sys", `Settling payment for service #${id} via gasless AA...`);
          try {
            await aa.sendGaslessTx(
              { target: PULSE_SCORE_ADDRESS, callData: encodeSettlePayment(BigInt(id), address, true) },
              signUserOp
            );
          } catch (err: unknown) {
            addLog("err", `Gasless settle failed: ${err instanceof Error ? err.message.slice(0, 120) : String(err)}`);
          }
        } else {
          addLog("sys", `Settling payment for service #${id} (x402 step 2)...`);
          writeSettle({ address: PULSE_SCORE_ADDRESS, abi: PULSE_SCORE_ABI, functionName: "settlePayment", args: [BigInt(id), address, true] });
        }
        break;
      }

      case "approve": {
        if (args[0] === "max") {
          const maxAmount = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
          if (aa.gaslessEnabled) {
            addLog("sys", "Approving unlimited USDC via gasless AA...");
            try {
              await aa.sendGaslessTx(
                { target: USDC_ADDRESS, callData: encodeApproveUSDC(PULSE_SCORE_ADDRESS, maxAmount) },
                signUserOp
              );
            } catch (err: unknown) {
              addLog("err", `Gasless approve failed: ${err instanceof Error ? err.message.slice(0, 120) : String(err)}`);
            }
          } else {
            addLog("sys", "Approving unlimited USDC for Sibyl...");
            addLog("sys", "WARNING: This allows the contract to spend all your USDC. Only use for trusted sessions.");
            writeApprove({ address: USDC_ADDRESS, abi: ERC20_ABI, functionName: "approve", args: [PULSE_SCORE_ADDRESS, maxAmount] });
          }
        } else {
          const amount = parseFloat(args[0]);
          if (!amount || isNaN(amount)) { addLog("err", "Usage: approve <amount_in_usdc> OR approve max"); return; }
          const raw = BigInt(Math.round(amount * USDCD));
          if (aa.gaslessEnabled) {
            addLog("sys", `Approving ${amount} USDC via gasless AA...`);
            try {
              await aa.sendGaslessTx(
                { target: USDC_ADDRESS, callData: encodeApproveUSDC(PULSE_SCORE_ADDRESS, raw) },
                signUserOp
              );
            } catch (err: unknown) {
              addLog("err", `Gasless approve failed: ${err instanceof Error ? err.message.slice(0, 120) : String(err)}`);
            }
          } else {
            addLog("sys", `Approving ${amount} USDC for Sibyl...`);
            writeApprove({ address: USDC_ADDRESS, abi: ERC20_ABI, functionName: "approve", args: [PULSE_SCORE_ADDRESS, raw] });
          }
        }
        break;
      }

      case "refresh":
        if (aa.gaslessEnabled) {
          addLog("sys", "Refreshing session via gasless AA...");
          try {
            await aa.sendGaslessTx(
              { target: PULSE_SCORE_ADDRESS, callData: encodeRefreshSession() },
              signUserOp
            );
          } catch (err: unknown) {
            addLog("err", `Gasless refresh failed: ${err instanceof Error ? err.message.slice(0, 120) : String(err)}`);
          }
        } else {
          addLog("sys", "Refreshing session budget...");
          writeRefresh({ address: PULSE_SCORE_ADDRESS, abi: PULSE_SCORE_ABI, functionName: "refreshSession" });
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
    if (!input.trim() || running) return;
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
            Live CLI for the Kite agentic economy. Register agents, discover services, and settle x402 payments — all from the command line.
            {aa.gaslessEnabled && (
              <span className="text-neon-green ml-2">[GASLESS MODE ACTIVE]</span>
            )}
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
                <span className={`text-[10px] ${isConnected && !isWrongChain ? "text-neon-green" : "text-danger"}`}>
                  {isConnected && !isWrongChain ? "● ONLINE" : "● OFFLINE"}
                </span>
                {aa.gaslessEnabled && (
                  <span className="text-[10px] text-neon-yellow font-bold tracking-wider">⚡ GASLESS</span>
                )}
              </div>
              <span className="text-[10px] text-text-tertiary font-mono">
                {isConnected && address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "not connected"} :: {realChainId ?? "?"}
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
              Create on-chain agent identity. Grants $100 session budget.
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
              x402 two-step: request service, then settle USDC payment.
            </p>
          </div>
        </div>

        {/* Gasless Info Card */}
        <div className="fade-in mt-6" style={{ animationDelay: "0.3s", padding: "20px", background: "rgba(10,10,10,0.85)", border: "1px solid #222" }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-neon-yellow text-lg">⚡</span>
            <span className="text-[12px] font-bold text-text-primary">ERC-4337 GASLESS MODE</span>
          </div>
          <p className="text-[11px] text-text-secondary leading-relaxed mb-3">
            Sibyl integrates the Kite AA SDK for gasless transactions via ERC-4337 Account Abstraction.
            When enabled, all contract interactions are sent as UserOperations through the Kite bundler —
            no native KITE gas required from your EOA wallet.
          </p>
          <div className="flex gap-2 flex-wrap">
            <span className="text-[10px] text-text-tertiary border border-border px-2 py-1">AA Wallet: Deterministic per EOA</span>
            <span className="text-[10px] text-text-tertiary border border-border px-2 py-1">Bundler: staging.gokite.ai</span>
            <span className="text-[10px] text-text-tertiary border border-border px-2 py-1">Settlement: 0x8d9F...a63E3</span>
          </div>
        </div>
      </div>
    </div>
  );
}
