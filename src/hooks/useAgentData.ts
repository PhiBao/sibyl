"use client";

import { useReadContract, useAccount } from "wagmi";
import { PULSE_SCORE_ADDRESS, PULSE_SCORE_ABI, USDC_DECIMALS, getScoreTier } from "@/lib/web3";

const USDCD = 10 ** USDC_DECIMALS;

export function useAgentData() {
  const { address, isConnected } = useAccount();

  const {
    data: agent,
    isLoading: agentLoading,
    error: agentError,
  } = useReadContract({
    address: PULSE_SCORE_ADDRESS,
    abi: PULSE_SCORE_ABI,
    functionName: "getAgent",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: agentCount, isLoading: countLoading } = useReadContract({
    address: PULSE_SCORE_ADDRESS,
    abi: PULSE_SCORE_ABI,
    functionName: "getAgentCount",
  });

  const { data: sessionRemaining } = useReadContract({
    address: PULSE_SCORE_ADDRESS,
    abi: PULSE_SCORE_ABI,
    functionName: "getSessionRemaining",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: recentTxns, isLoading: txnsLoading } = useReadContract({
    address: PULSE_SCORE_ADDRESS,
    abi: PULSE_SCORE_ABI,
    functionName: "getAgentTransactions",
    args: address ? [address, BigInt(10)] : undefined,
    query: { enabled: !!address },
  });

  const score = agent ? Number(agent.score) : 0;
  const totalTxns = agent ? Number(agent.totalTxns) : 0;
  const successTxns = agent ? Number(agent.successTxns) : 0;
  const rawTotalSpent = agent ? Number(agent.totalSpent) : 0;
  const totalSpent = rawTotalSpent / USDCD;
  const sessionBudget = agent ? Number(agent.sessionBudget) / USDCD : 0;
  const sessionSpent = agent ? Number(agent.sessionSpent) / USDCD : 0;
  const successRate = totalTxns > 0 ? ((successTxns / totalTxns) * 100).toFixed(1) : "0.0";
  const tier = getScoreTier(score);
  const exists = agent?.exists ?? false;
  const registeredAt = agent ? new Date(Number(agent.registeredAt) * 1000).toISOString().split("T")[0] : null;

  const transactions = recentTxns
    ? recentTxns.map((tx) => ({
        buyer: tx.buyer,
        provider: tx.provider,
        serviceId: Number(tx.serviceId),
        amount: Number(tx.amount) / USDCD,
        success: tx.success,
        timestamp: Number(tx.timestamp) * 1000,
        scoreChange: Number(tx.scoreChange),
        x402Authorized: tx.x402Authorized,
        date: new Date(Number(tx.timestamp) * 1000).toISOString().split("T")[0],
        time: new Date(Number(tx.timestamp) * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }))
    : [];

  const isLoading = agentLoading || countLoading;

  return {
    address,
    isConnected,
    exists,
    score,
    totalTxns,
    successTxns,
    totalSpent,
    sessionBudget,
    sessionSpent,
    sessionRemaining: sessionRemaining ? Number(sessionRemaining) / USDCD : 0,
    successRate,
    tier,
    registeredAt,
    agentCount: agentCount ? Number(agentCount) : 0,
    isLoading,
    isError: !!agentError,
    transactions,
    txnsLoading,
  };
}
