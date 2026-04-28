// Kite Chain Configuration
export const KITE_CHAIN = {
  chainId: 2366,
  name: "Kite",
  rpcUrl: "https://rpc.kite.ai",
  blockExplorer: "https://explorer.kite.ai",
  nativeCurrency: {
    name: "KITE",
    symbol: "KITE",
    decimals: 18,
  },
};

// USDC on Kite Chain
export const USDC_ADDRESS = "0x0000000000000000000000000000000000000000"; // Placeholder — replace with actual

// Pulse Score Contract (will be updated after deploy)
export const PULSE_SCORE_ADDRESS = "0x0776AF7E068E2f2E1651D358ea29Cfa068F909cd"; // Deployed on Kite testnet

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

// Demo data for hackathon presentation
export const DEMO_AGENT = {
  address: "0x45d72E7F3C8a616E561a2c69A7b1d224D443F07b",
  name: "KitePulse Demo Agent",
  score: 742,
  tier: "Reliable",
  totalTransactions: 156,
  successRate: 98.7,
  totalSpent: 2847.50,
  avgTransactionValue: 18.25,
  memberSince: "2026-01-15",
};

export const DEMO_TRANSACTIONS = [
  { id: 1, type: "API Call", service: "GPT-4 Inference", amount: 0.045, status: "success", timestamp: "2026-04-28T20:15:00Z", scoreChange: +2 },
  { id: 2, type: "Data Feed", service: "Price Oracle v3", amount: 0.12, status: "success", timestamp: "2026-04-28T19:42:00Z", scoreChange: +3 },
  { id: 3, type: "Compute", service: "GPU Render Farm", amount: 2.50, status: "success", timestamp: "2026-04-28T18:30:00Z", scoreChange: +5 },
  { id: 4, type: "Storage", service: "IPFS Pinning", amount: 0.08, status: "success", timestamp: "2026-04-28T17:15:00Z", scoreChange: +1 },
  { id: 5, type: "API Call", service: "Whisper Transcription", amount: 0.032, status: "success", timestamp: "2026-04-28T16:00:00Z", scoreChange: +2 },
  { id: 6, type: "Creative", service: "DALL-E 3 Generate", amount: 0.08, status: "failed", timestamp: "2026-04-28T14:30:00Z", scoreChange: -8 },
  { id: 7, type: "API Call", service: "Embedding Model v2", amount: 0.002, status: "success", timestamp: "2026-04-28T13:00:00Z", scoreChange: +1 },
  { id: 8, type: "Data Feed", service: "Weather API Pro", amount: 0.05, status: "success", timestamp: "2026-04-28T11:45:00Z", scoreChange: +2 },
];

export const DEMO_MARKETPLACE = [
  { id: 1, name: "GPT-4 Turbo Inference", provider: "OpenRouter", category: "API", price: 0.03, minScore: 0, rating: 4.9, latency: "120ms" },
  { id: 2, name: "Claude 3.5 Sonnet", provider: "Anthropic", category: "API", price: 0.015, minScore: 200, rating: 4.8, latency: "95ms" },
  { id: 3, name: "Real-time Price Feeds", provider: "Chainlink", category: "Data", price: 0.10, minScore: 400, rating: 5.0, latency: "50ms" },
  { id: 4, name: "GPU Render (A100)", provider: "Render Network", category: "Compute", price: 1.20, minScore: 500, rating: 4.7, latency: "2s" },
  { id: 5, name: "Premium IPFS Pinning", provider: "Pinata", category: "Storage", price: 0.05, minScore: 300, rating: 4.6, latency: "200ms" },
  { id: 6, name: "Whisper v3 Large", provider: "Replicate", category: "API", price: 0.025, minScore: 0, rating: 4.5, latency: "800ms" },
  { id: 7, name: "DALL-E 3 HD", provider: "OpenAI", category: "Creative", price: 0.08, minScore: 600, rating: 4.9, latency: "3s" },
  { id: 8, name: "Stable Video Diffusion", provider: "Replicate", category: "Creative", price: 0.15, minScore: 800, rating: 4.4, latency: "8s" },
];
