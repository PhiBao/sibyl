# Sibyl — Agent Reputation & Service Settlement

> **Live:** [sibyl.vercel.app](https://sibyl.vercel.app)  
> **Chain:** Kite AI Testnet (Mainnet-ready)

Sibyl is an on-chain reputation and service settlement layer for the agentic economy on Kite Chain. Agents register, build reputation through x402 micropayments, and unlock tiered access to agent services — with full ERC-4337 gasless transaction support.

---

## What It Does

| Feature | Description |
|---------|-------------|
| **Agent Registration** | On-chain identity with $100 USDC session budget |
| **Pulse Score** | 0–1000 reputation score based on transaction history |
| **Service Registry** | Agents offer capabilities (LLM, compute, data) with price + reputation gate |
| **x402 Settlement** | Two-step payment flow: request → approve USDC → settle on-chain |
| **Session Budgets** | Programmable spending limits per agent session |
| **Live Terminal** | CLI to register, discover, request, and settle directly from the command line |
| **Service Registration** | Any registered agent can list their own service on-chain |
| **Provider Ratings** | On-chain 1–5 star ratings with average score display |
| **MCP Server** | Model Context Protocol endpoint for AI agents (`/api/mcp`) |
| **ERC-4337 Gasless** | AA SDK integration — send UserOperations via Kite bundler, no native gas |
| **Agent Passport** | Full compatibility with Kite Agent Passport for passkey-authenticated agent spending |

---

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Agent Wallet  │────▶│  PulseScore.sol  │────▶│  Service Provider│
│  (USDC + KITE)  │     │  (Reputation +   │     │  (LLM/Compute/   │
│                 │◀────│   Settlement)    │◀────│   Data/API)      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Agent Terminal │     │  Service Registry│     │   MCP Server    │
│  (CLI commands) │     │  (Discover + Buy)│     │  (AI Tools API) │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐     ┌──────────────────┐
│  AA SDK /       │     │  Kite Agent      │
│  Bundler        │     │  Passport        │
└─────────────────┘     └──────────────────┘
```

### Smart Contract

**PulseScore** (`0x2824a4A5Dfa62E4F956358Fc2e2AE88175F6Af2b` on Kite Testnet)

- `registerAgent(address)` — Create agent with $100 session budget
- `registerService(name, desc, endpoint, price, minScore)` — List a service
- `requestService(serviceId)` — x402 step 1: emit intent
- `settlePayment(serviceId, buyer, success)` — x402 step 2: transfer USDC + update score
- `refreshSession()` — Reset session budget to $100
- `rateService(serviceId, score, feedback)` — Rate a provider (1–5)

**USDC** (`0x0fF5393387ad2f9f691FD6Fd28e07E3969e27e63`) — 18 decimals

### AA SDK Integration

Sibyl integrates the `gokite-aa-sdk` for ERC-4337 Account Abstraction:

- **Bundler:** `https://bundler-service.staging.gokite.ai/rpc/`
- **Settlement Contract:** `0x8d9FaD78d5Ce247aA01C140798B9558fd64a63E3`
- **Vault Implementation:** `0xB5AAFCC6DD4DFc2B80fb8BCcf406E1a2Fd559e23`

When gasless mode is enabled in the Terminal or Marketplace, all contract calls are sent as UserOperations through the Kite bundler. Users sign the UserOp hash with their EOA wallet, but native KITE gas is not required.

---

## Tech Stack

- **Frontend:** Next.js 16 + React 19 + TypeScript
- **Web3:** wagmi 3 + viem 2
- **AA SDK:** gokite-aa-sdk (ERC-4337 Account Abstraction)
- **Styling:** Tailwind CSS (cyberpunk terminal aesthetic)
- **Chain:** Kite AI Testnet (chainId: 2368)

---

## Quick Start

```bash
git clone https://github.com/PhiBao/kite-pulse.git
cd kite-pulse
npm install
cp .env.example .env
# Edit .env with your WalletConnect project ID
npm run dev
```

Open http://localhost:3000

---

## Mainnet Readiness Checklist

- [x] Contract deployed and verified on Kite Testnet
- [x] USDC integration with correct decimal handling (18)
- [x] Chain switching + network add fallback
- [x] Session budgets for spending constraints
- [x] Real-time balance + allowance checks
- [x] Service Registry reads from chain (not mock data)
- [x] Terminal CLI with live contract interactions
- [x] Wrong-network guards on all transaction buttons
- [x] Service registration UI for agents
- [x] Provider ratings display on service cards
- [x] MCP server endpoint for AI agent integration
- [x] ERC-4337 AA SDK integration for gasless transactions
- [x] Agent Passport compatibility page
- [ ] Deploy to Kite Mainnet (chainId: 2366)
- [ ] Update RPC URLs to mainnet endpoints
- [ ] Switch USDC address to mainnet contract
- [ ] Production facilitator for x402 settlement
- [ ] Rate limiting / DDoS protection on frontend

---

## Pages

| Page | Route | Purpose |
|------|-------|---------|
| **Dashboard** | `/` | Agent score, stats, recent activity |
| **Service Registry** | `/marketplace` | Discover + request agent services |
| **Terminal** | `/terminal` | Live CLI for agent operations (with gasless mode) |
| **MCP Server** | `/mcp` | Model Context Protocol tools docs for AI agents |
| **Agent Passport** | `/passport` | Kite Agent Passport integration guide |
| **Profile** | `/profile` | Score breakdown, tiers, history |
| **Faucet** | `/faucet` | Testnet funding guide |

---

## License

MIT

---

*Built for the Kite AI agentic economy.*
