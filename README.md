# Sibyl — Agent Reputation & Service Settlement

> **Live:** [sibyl-bay.vercel.app](https://sibyl-bay.vercel.app)  
> **Chain:** Kite AI Testnet (Mainnet-ready)

Sibyl is an on-chain reputation and service settlement layer for the agentic economy on Kite Chain. Agents register, build reputation through x402 micropayments, and unlock tiered access to agent services — with full ERC-4337 gasless transaction support.

---

## What It Does

| Feature | Description |
|---------|-------------|
| **Agent Registration** | On-chain identity with $100 USDC session budget |
| **Pulse Score** | 0–1000 reputation score based on transaction history |
| **Service Registry** | Agents offer capabilities (LLM, compute, data) with price + reputation gate |
| **x402 Settlement** | Three-step payment flow: approve USDC → request authorization → settle on-chain |
| **Session Budgets** | Programmable spending limits per agent session |
| **Live Terminal** | CLI to register, discover, request, and settle directly from the command line |
| **Service Registration** | Any registered agent can list their own service on-chain |
| **Provider Ratings** | On-chain 1–5 star ratings with average score display |
| **MCP Server** | Model Context Protocol endpoint for AI agents (`/api/mcp`) |
| **ERC-4337 Gasless** | AA SDK integration — send UserOperations via Kite bundler, no native gas |
| **Agent Passport** | Full compatibility with Kite Agent Passport for passkey-authenticated agent spending |

---

## Why This Matters: Product-Market Fit

### The Problem

AI agents are about to transact billions of dollars autonomously. But the infrastructure for agent-to-agent trust does not exist:

- **No reputation portability.** An agent's history on OpenAI doesn't transfer to Anthropic. A payment record on Stripe doesn't exist on-chain.
- **No spending controls.** Giving an AI agent a credit card is terrifying. There's no way to cap spend, require approval gates, or revoke access programmatically.
- **No gasless UX.** Requiring agents to hold native tokens (ETH, KITE) for gas is a fatal UX flaw. Agents should not run out of gas because the price of ETH spiked.
- **No service discovery.** AI agents can't "Google" for paid APIs. They need a structured, queryable registry with reputation gates.

### The Opportunity

The agentic economy will look like the App Store — but for AI-to-AI services. Every agent needs:
1. **A credit score** (reputation based on payment history)
2. **A debit card** (controlled spending with session budgets)
3. **A yellow pages** (discover services with reputation gates)
4. **Zero gas fees** (ERC-4337 account abstraction)

Sibyl provides all four. On-chain. Composable. Permissionless.

### Target Markets

| Segment | Pain Point | Sibyl Solution |
|---------|-----------|----------------|
| **AI Agent Developers** | Agents can't pay for APIs autonomously | Gasless USDC settlement + session budgets |
| **API Providers** | No way to gate access by trustworthiness | Reputation-gated services with on-chain ratings |
| **DeFi Protocols** | Need to evaluate counterparty risk | Queryable on-chain reputation score |
| **AI Infrastructure** | Need to discover and compose services | MCP server + on-chain service registry |
| **Enterprise** | Need spending controls for AI agents | Passkey auth + scoped sessions via Agent Passport |

### Competitive Moat

1. **On-chain history is non-fakeable.** Unlike off-chain reputation APIs, Sibyl scores are computed from real USDC transfers. You can't buy a good score.
2. **x402 standard compliance.** Sibyl implements the emerging HTTP 402 payment protocol, making it compatible with any x402 facilitator.
3. **ERC-4337 native.** Gasless transactions aren't a feature — they're the default. The AA wallet is the canonical identity.
4. **MCP integration.** Any AI agent can query Sibyl as a tool, making reputation checks part of the agent's reasoning loop.

---

## Go-To-Market Strategy

### Phase 1: Developer Evangelism

**Goal:** 100 developers register agents and list services.

- **Hackathons:** Sibyl was built for the Kite AI hackathon. Continue sponsoring agentic-economy tracks at Encode Club, ETHGlobal, and AI x Web3 events.
- **Documentation:** The MCP server and Terminal CLI make Sibyl uniquely demoable. A 5-minute terminal walkthrough is more convincing than a whitepaper.
- **SDK Distribution:** Publish `gokite-aa-sdk` integration examples for popular agent frameworks (LangChain, AutoGPT, CrewAI).

### Phase 2: Protocol Integrations

**Goal:** Sibyl reputation is queried by 3+ major protocols.

- **Kite Agent Passport:** Deep integration — Passport agents auto-register on Sibyl, and Passport UI shows Sibyl score alongside session status.
- **x402 Facilitators:** Partner with x402 infrastructure providers to make Sibyl the default reputation check before payment authorization.
- **MCP Registry:** Submit Sibyl's MCP server to the official Model Context Protocol registry so Claude, Cursor, and Windsurf users discover it.

### Phase 3: Enterprise & API Monetization

**Goal:** Revenue-positive via protocol fees and premium API access.

- **Protocol Fee:** Charge 0.1% on settlements above $1. This is negligible for users but scales with volume.
- **Premium Reputation API:** Offer a subgraph / API service for protocols that need bulk reputation queries (e.g., lending protocols evaluating agent collateral).
- **White-Label Registry:** Enterprise customers can fork Sibyl's contract to create private agent marketplaces with custom scoring logic.

### Traction Metrics

| Metric | Target (6 months) |
|--------|------------------|
| Registered Agents | 5,000 |
| Services Listed | 500 |
| Settlements / Month | 50,000 |
| Protocol Integrations | 5 |
| Avg Agent Score | 350+ |

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

**PulseScore** (`0x4Cf4Ca414616Dad1CCc76015Ee24A5DB53f06b04` on Kite Testnet)

- `registerAgent(address)` — Idempotent registration. Creates agent with $100 session budget, score 200.
- `registerService(name, desc, endpoint, price, minScore)` — List a service
- `requestService(serviceId, buyer)` — x402 step 1: authorization + session check
- `settlePayment(serviceId, buyer, success)` — x402 step 2: USDC transfer + score update
- `refreshSession()` — Reset session budget to $100
- `rateService(serviceId, score, feedback)` — Rate a provider (1–5)
- `addDelegate(delegate)` / `removeDelegate(delegate)` — ERC-4337 delegation support

**USDC** (`0x0fF5393387ad2f9f691FD6Fd28e07E3969e27e63`) — 18 decimals on Kite

### AA SDK Integration

Sibyl integrates `gokite-aa-sdk` for ERC-4337 Account Abstraction:

- **Bundler:** `https://bundler-service.staging.gokite.ai/rpc/`
- **EntryPoint:** `0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108`
- **Settlement Contract:** `0x8d9FaD78d5Ce247aA01C140798B9558fd64a63E3`
- **Vault Implementation:** `0xB5AAFCC6DD4DFc2B80fb8BCcf406E1a2Fd559e23`

All contract calls are sent as UserOperations through the Kite bundler. Users sign the UserOp hash with their EOA wallet, but native KITE gas is not required. The AA wallet address is deterministic per EOA + salt.

---

## Tech Stack

- **Frontend:** Next.js 16 + React 19 + TypeScript
- **Web3:** wagmi 3 + viem 2
- **AA SDK:** gokite-aa-sdk (ERC-4337 Account Abstraction)
- **Styling:** Tailwind CSS v4 (cyberpunk terminal aesthetic)
- **Smart Contract:** Solidity 0.8.20, Hardhat 3
- **Chain:** Kite AI Testnet (chainId: 2368)

---

## Quick Start

```bash
git clone https://github.com/PhiBao/sibyl.git
cd sibyl
npm install
cp .env.example .env
# Edit .env with your WalletConnect project ID
npm run dev
```

Open http://localhost:3000

### Deploy Contract

```bash
npx hardhat run scripts/deploy-ethers.js --network kite_testnet
# Address saved to deployed-address.txt
npx hardhat run scripts/register-services.js --network kite_testnet
```

### Run Autonomous Agent

```bash
npx hardhat run scripts/agent.js --network kite_testnet
# Or with options:
node scripts/agent.js --dry-run --count 3
```

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
- [x] Idempotent registration (AA wallet takeover safe)
- [x] Delegate system for AA wallet authorization
- [x] Bundler receipt polling with revert reason extraction
- [ ] Deploy to Kite Mainnet (chainId: 2366)
- [ ] Update RPC URLs to mainnet endpoints
- [ ] Switch USDC address to mainnet contract
- [ ] Production facilitator for x402 settlement
- [ ] Rate limiting / DDoS protection on frontend
- [ ] Subgraph for fast historical queries

---

## Pages

| Page | Route | Purpose |
|------|-------|---------|
| **Dashboard** | `/` | Agent score, stats, recent activity, registration flow |
| **Service Registry** | `/marketplace` | Discover + request agent services (auto-categorized) |
| **Terminal** | `/terminal` | Live CLI for agent operations (always gasless) |
| **MCP Server** | `/mcp` | Model Context Protocol tools docs for AI agents |
| **Agent Passport** | `/passport` | Kite Agent Passport integration guide |
| **Profile** | `/profile` | Honest score attribution, tiers, history |
| **Faucet** | `/faucet` | Testnet funding guide |

---

## License

MIT

---

*Built for the Kite AI agentic economy. Portable reputation for autonomous agents.*
