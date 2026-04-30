import { createConfig, http } from "wagmi";
import { createPublicClient, defineChain, http as viemHttp } from "viem";
import { metaMask, walletConnect, coinbaseWallet } from "wagmi/connectors";

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

/** Prompt wallet to add Kite Testnet via wallet_addEthereumChain */
export async function addKiteNetwork(): Promise<void> {
  const ethereum = (window as unknown as { ethereum?: { request: (args: unknown) => Promise<unknown> } }).ethereum;
  if (!ethereum) throw new Error("No wallet detected. Install MetaMask or Rabby first.");
  await ethereum.request({
    method: "wallet_addEthereumChain",
    params: [
      {
        chainId: `0x${kiteTestnet.id.toString(16)}`,
        chainName: kiteTestnet.name,
        nativeCurrency: kiteTestnet.nativeCurrency,
        rpcUrls: ["https://rpc-testnet.gokite.ai"],
        blockExplorerUrls: ["https://testnet.kitescan.ai"],
      },
    ],
  });
}

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

// WalletConnect project ID (free tier)
const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WC_PROJECT_ID || "c4f79cc821944d9680842e34466bfb";

export const config = createConfig({
  chains: [kiteTestnet, kiteMainnet],
  connectors: [
    metaMask(),
    walletConnect({
      projectId: WC_PROJECT_ID,
      showQrModal: true,
    }),
    coinbaseWallet({
      appName: "Sibyl",
      appLogoUrl: "https://sibyl.dev/icon.png",
    }),
  ],
  transports: {
    [kiteTestnet.id]: http("https://rpc-testnet.gokite.ai"),
    [kiteMainnet.id]: http("https://rpc.gokite.ai"),
  },
});

// Contract addresses
export const PULSE_SCORE_ADDRESS = (process.env.NEXT_PUBLIC_PULSE_SCORE_ADDRESS || "0x4Cf4Ca414616Dad1CCc76015Ee24A5DB53f06b04") as `0x${string}`;
export const USDC_ADDRESS = (process.env.NEXT_PUBLIC_USDC_ADDRESS || "0x0fF5393387ad2f9f691FD6Fd28e07E3969e27e63") as `0x${string}`;

// Kite testnet USDC uses 18 decimals (bridged USDC.e)
export const USDC_DECIMALS = 18;

// PulseScore ABI (focused subset for frontend)
export const PULSE_SCORE_ABI = [
  {
    type: "constructor",
    inputs: [{ name: "_usdcToken", type: "address" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "usdcToken",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
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
    name: "refreshSession",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "addDelegate",
    inputs: [{ name: "delegate", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "removeDelegate",
    inputs: [{ name: "delegate", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "delegates",
    inputs: [
      { name: "", type: "address" },
      { name: "", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "registerService",
    inputs: [
      { name: "_name", type: "string" },
      { name: "_description", type: "string" },
      { name: "_endpoint", type: "string" },
      { name: "_price", type: "uint256" },
      { name: "_minScore", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "requestService",
    inputs: [
      { name: "_serviceId", type: "uint256" },
      { name: "_buyer", type: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "settlePayment",
    inputs: [
      { name: "_serviceId", type: "uint256" },
      { name: "_buyer", type: "address" },
      { name: "_success", type: "bool" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "rateService",
    inputs: [
      { name: "_serviceId", type: "uint256" },
      { name: "_score", type: "uint8" },
      { name: "_feedback", type: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
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
          { name: "sessionBudget", type: "uint256" },
          { name: "sessionSpent", type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getService",
    inputs: [{ name: "_serviceId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "provider", type: "address" },
          { name: "name", type: "string" },
          { name: "description", type: "string" },
          { name: "endpoint", type: "string" },
          { name: "price", type: "uint256" },
          { name: "minScore", type: "uint256" },
          { name: "exists", type: "bool" },
          { name: "totalCalls", type: "uint256" },
          { name: "successfulCalls", type: "uint256" },
          { name: "totalRevenue", type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getAgentServices",
    inputs: [{ name: "_agent", type: "address" }],
    outputs: [{ name: "", type: "uint256[]" }],
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
    name: "getSessionRemaining",
    inputs: [{ name: "_agent", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getAgentTransactions",
    inputs: [
      { name: "_agent", type: "address" },
      { name: "_count", type: "uint256" },
    ],
    outputs: [
      {
        type: "tuple[]",
        components: [
          { name: "buyer", type: "address" },
          { name: "provider", type: "address" },
          { name: "serviceId", type: "uint256" },
          { name: "amount", type: "uint256" },
          { name: "success", type: "bool" },
          { name: "timestamp", type: "uint256" },
          { name: "scoreChange", type: "int256" },
          { name: "x402Authorized", type: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getServiceAverageRating",
    inputs: [{ name: "_serviceId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
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
    name: "getServiceCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "agents",
    inputs: [{ name: "", type: "address" }],
    outputs: [
      { name: "owner", type: "address" },
      { name: "score", type: "uint256" },
      { name: "totalTxns", type: "uint256" },
      { name: "successTxns", type: "uint256" },
      { name: "totalSpent", type: "uint256" },
      { name: "registeredAt", type: "uint256" },
      { name: "lastUpdated", type: "uint256" },
      { name: "exists", type: "bool" },
      { name: "sessionBudget", type: "uint256" },
      { name: "sessionSpent", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "services",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "provider", type: "address" },
      { name: "name", type: "string" },
      { name: "description", type: "string" },
      { name: "endpoint", type: "string" },
      { name: "price", type: "uint256" },
      { name: "minScore", type: "uint256" },
      { name: "exists", type: "bool" },
      { name: "totalCalls", type: "uint256" },
      { name: "successfulCalls", type: "uint256" },
      { name: "totalRevenue", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "AgentRegistered",
    inputs: [
      { name: "agent", type: "address", indexed: true },
      { name: "owner", type: "address", indexed: true },
      { name: "budget", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "ServiceRegistered",
    inputs: [
      { name: "serviceId", type: "uint256", indexed: true },
      { name: "provider", type: "address", indexed: true },
      { name: "name", type: "string", indexed: false },
      { name: "price", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "PaymentSettled",
    inputs: [
      { name: "serviceId", type: "uint256", indexed: true },
      { name: "buyer", type: "address", indexed: true },
      { name: "provider", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "success", type: "bool", indexed: false },
      { name: "newBuyerScore", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "ScoreUpdated",
    inputs: [
      { name: "agent", type: "address", indexed: true },
      { name: "oldScore", type: "uint256", indexed: false },
      { name: "newScore", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "ServiceRated",
    inputs: [
      { name: "serviceId", type: "uint256", indexed: true },
      { name: "rater", type: "address", indexed: true },
      { name: "score", type: "uint8", indexed: false },
    ],
  },
  {
    type: "event",
    name: "SessionRefreshed",
    inputs: [
      { name: "agent", type: "address", indexed: true },
      { name: "newBudget", type: "uint256", indexed: false },
    ],
  },
] as const;

// ERC20 ABI for USDC approval and transfer
export const ERC20_ABI = [
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "transfer",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
  },
] as const;

// Score tiers
export const SCORE_TIERS = [
  { min: 0, max: 199, label: "Unverified", color: "#888888", icon: "◯" },
  { min: 200, max: 399, label: "Newcomer", color: "#f0f000", icon: "△" },
  { min: 400, max: 599, label: "Trusted", color: "#00d4ff", icon: "◇" },
  { min: 600, max: 799, label: "Reliable", color: "#00ff41", icon: "☆" },
  { min: 800, max: 1000, label: "Elite", color: "#ff0055", icon: "◆" },
] as const;

export function getScoreTier(score: number) {
  return SCORE_TIERS.find((t) => score >= t.min && score <= t.max) ?? SCORE_TIERS[0];
}

// Public client for direct chain reads (no wagmi hook needed)
export const publicClient = createPublicClient({
  chain: kiteTestnet,
  transport: viemHttp("https://rpc-testnet.gokite.ai"),
});
