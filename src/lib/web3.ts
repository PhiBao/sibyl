import { createConfig, http } from "wagmi";
import { defineChain } from "viem";

// Kite AI Testnet
export const kiteTestnet = defineChain({
  id: 2368,
  name: "Kite AI Testnet",
  nativeCurrency: { name: "KITE", symbol: "KITE", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc-testnet.gokite.ai"] },
  },
  blockExplorers: {
    default: { name: "KiteScan", url: "https://testnet.kitescan.ai" },
  },
});

// Kite AI Mainnet
export const kiteMainnet = defineChain({
  id: 2366,
  name: "Kite AI",
  nativeCurrency: { name: "KITE", symbol: "KITE", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.gokite.ai"] },
  },
  blockExplorers: {
    default: { name: "KiteScan", url: "https://kitescan.ai" },
  },
});

export const config = createConfig({
  chains: [kiteTestnet, kiteMainnet],
  transports: {
    [kiteTestnet.id]: http("https://rpc-testnet.gokite.ai"),
    [kiteMainnet.id]: http("https://rpc.gokite.ai"),
  },
});

// Contract addresses
export const PULSE_SCORE_ADDRESS = (process.env.NEXT_PUBLIC_PULSE_SCORE_ADDRESS || "0x0776AF7E068E2f2E1651D358ea29Cfa068F909cd") as `0x${string}`;
export const USDC_ADDRESS = (process.env.NEXT_PUBLIC_USDC_ADDRESS || "0x0fF5393387ad2f9f691FD6Fd28e07E3969e27e63") as `0x${string}`;

// PulseScore ABI (subset we need)
export const PULSE_SCORE_ABI = [
  {
    type: "function",
    name: "getAgent",
    inputs: [{ name: "_agent", type: "address" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "owner", type: "address" },
          { name: "score", type: "uint256" },
          { name: "totalTxns", type: "uint256" },
          { name: "successTxns", type: "uint256" },
          { name: "totalSpent", type: "uint256" },
          { name: "registeredAt", type: "uint256" },
          { name: "lastUpdated", type: "uint256" },
          { name: "exists", type: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getScore",
    inputs: [{ name: "_agent", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getSuccessRate",
    inputs: [{ name: "_agent", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getTransactionCount",
    inputs: [{ name: "_agent", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getRecentTransactions",
    inputs: [
      { name: "_agent", type: "address" },
      { name: "_count", type: "uint256" },
    ],
    outputs: [
      {
        type: "tuple[]",
        components: [
          { name: "agent", type: "address" },
          { name: "service", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "success", type: "bool" },
          { name: "timestamp", type: "uint256" },
          { name: "scoreChange", type: "int256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "meetsThreshold",
    inputs: [
      { name: "_agent", type: "address" },
      { name: "_minScore", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getAgentCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "registerAgent",
    inputs: [{ name: "_agentAddress", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "recordTransaction",
    inputs: [
      { name: "_agent", type: "address" },
      { name: "_service", type: "address" },
      { name: "_amount", type: "uint256" },
      { name: "_success", type: "bool" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "AgentRegistered",
    inputs: [
      { name: "agent", type: "address", indexed: true },
      { name: "owner", type: "address", indexed: true },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "TransactionRecorded",
    inputs: [
      { name: "agent", type: "address", indexed: true },
      { name: "service", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "success", type: "bool", indexed: false },
      { name: "scoreChange", type: "int256", indexed: false },
      { name: "newScore", type: "uint256", indexed: false },
    ],
  },
] as const;

// Score tiers
export const SCORE_TIERS = [
  { min: 0, max: 199, label: "Unverified", color: "#636366", icon: "⚪" },
  { min: 200, max: 399, label: "Newcomer", color: "#FF9F0A", icon: "🟠" },
  { min: 400, max: 599, label: "Trusted", color: "#0A84FF", icon: "🔵" },
  { min: 600, max: 799, label: "Reliable", color: "#30D158", icon: "🟢" },
  { min: 800, max: 1000, label: "Elite", color: "#BF5AF2", icon: "🟣" },
] as const;

export function getScoreTier(score: number) {
  return SCORE_TIERS.find((t) => score >= t.min && score <= t.max) ?? SCORE_TIERS[0];
}
