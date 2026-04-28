"use client";

import { useReadContract, useAccount } from "wagmi";
import { PULSE_SCORE_ADDRESS, PULSE_SCORE_ABI, getScoreTier } from "@/lib/web3";

export function useAgentData() {
  const { address, isConnected } = useAccount();

  const { data: agent, isLoading: agentLoading } = useReadContract({
    address: PULSE_SCORE_ADDRESS,
    abi: PULSE_SCORE_ABI,
    functionName: "getAgent",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: agentCount } = useReadContract({
    address: PULSE_SCORE_ADDRESS,
    abi: PULSE_SCORE_ABI,
    functionName: "getAgentCount",
  });

  const score = agent ? Number(agent.score) : 0;
  const totalTxns = agent ? Number(agent.totalTxns) : 0;
  const successTxns = agent ? Number(agent.successTxns) : 0;
  const totalSpent = agent ? Number(agent.totalSpent) : 0;
  const successRate = totalTxns > 0 ? ((successTxns / totalTxns) * 100).toFixed(1) : "0.0";
  const avgTxn = totalTxns > 0 ? (totalSpent / totalTxns / 1e6).toFixed(2) : "0.00";
  const tier = getScoreTier(score);
  const exists = agent?.exists ?? false;
  const registeredAt = agent ? new Date(Number(agent.registeredAt) * 1000).toISOString().split("T")[0] : null;

  return {
    address,
    isConnected,
    exists,
    score,
    totalTxns,
    successTxns,
    totalSpent: totalSpent / 1e6, // Convert from 6 decimals
    successRate,
    avgTxn,
    tier,
    registeredAt,
    agentCount: agentCount ? Number(agentCount) : 0,
    isLoading: agentLoading,
  };
}
