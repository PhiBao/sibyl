# KitePulse — On-Chain Agent Reputation System

> **Your agent's reputation. On-chain. Earned, not given.**

KitePulse is an autonomous agent commerce intelligence layer built on [Kite Chain](https://gokite.ai) — the first AI Payments Blockchain. It gives AI agents a verifiable on-chain reputation score (Pulse Score) based on their transaction history, enabling trust-gated marketplaces and spend optimization.

**Track:** Agentic Commerce | **Prize Target:** $5,000 (1st Place)

---

## 🎯 What It Does

1. **AI agents register on-chain** via Kite Agent Passport, creating a verifiable identity
2. **Agents execute paid actions** (API calls, data feeds, compute) using USDC via x402 protocol
3. **Every transaction is attested on-chain** via the PulseScore smart contract
4. **Reputation builds automatically** — successful transactions increase Pulse Score, failures decrease it
5. **Service providers gate access** by minimum Pulse Score — higher reputation unlocks premium services

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                  KitePulse UI                    │
│         Next.js 14 · Tailwind · viem/wagmi      │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  Dashboard│  │ Market-  │  │    Agent     │  │
│  │  (Score)  │  │  place   │  │   Profile    │  │
│  └────┬─────┘  └────┬─────┘  └──────┬───────┘  │
│       │              │               │           │
├───────┴──────────────┴───────────────┴───────────┤
│           Kite Agent Passport (kpass)             │
│         Identity · Sessions · x402 Payments      │
├──────────────────────────────────────────────────┤
│            PulseScore Smart Contract              │
│     Registration · Attestation · Scoring          │
├──────────────────────────────────────────────────┤
│              Kite Chain (Testnet: 2368)           │
│           USDC Settlement · Gasless via AA SDK    │
└──────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MetaMask or any EVM wallet
- Kite Agent Passport (for agent features)

### 1. Clone & Install

```bash
git clone https://github.com/PhiBao/kite-pulse.git
cd kite-pulse
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your values (or use defaults for demo)
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — connect your wallet to see your Pulse Score.

### 4. Run the Autonomous Agent

```bash
# Install Kite Agent Passport
curl -fsSL https://agentpassport.ai/install.sh | bash

# Register your agent
kpass signup init --email you@example.com --output json
kpass agent:register --type research-agent --output json

# Create a spending session
kpass agent:session create \
  --task-summary "KitePulse demo" \
  --max-amount-per-tx 2 \
  --max-total-amount 10 \
  --ttl 24h \
  --assets USDC \
  --payment-approach x402_http \
  --output json

# Run the agent (dry run first)
node scripts/agent.js --dry-run --count 3

# Run live
node scripts/agent.js --count 5
```

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, Tailwind CSS v4, TypeScript |
| Web3 | viem, wagmi, @tanstack/react-query |
| Smart Contract | Solidity 0.8.20 (PulseScore.sol) |
| Chain | Kite AI Testnet (Chain ID 2368) |
| Identity | Kite Agent Passport (kpass CLI) |
| Payments | USDC via x402 protocol |
| Gasless | gokite-aa-sdk (ERC-4337) |
| Deploy | Vercel (frontend), Kite Chain (contracts) |

---

## 📄 Smart Contract

**PulseScore** — deployed on Kite Testnet at:
`0x0776AF7E068E2f2E1651D358ea29Cfa068F909cd`

**Explorer:** [testnet.kitescan.ai/address/0x0776AF7E068E2f2E1651D358ea29Cfa068F909cd](https://testnet.kitescan.ai/address/0x0776AF7E068E2f2E1651D358ea29Cfa068F909cd)

### Key Functions

| Function | Description |
|----------|-------------|
| `registerAgent(address)` | Register an agent on-chain (initial score: 200) |
| `recordTransaction(agent, service, amount, success)` | Record a transaction attestation |
| `getAgent(address)` | Get full agent profile |
| `getScore(address)` | Get current Pulse Score |
| `getSuccessRate(address)` | Get success rate in basis points |
| `meetsThreshold(address, minScore)` | Check if agent meets a score gate |

### Score Mechanics

- **Success:** +5 to +8 points (scales with transaction value)
- **Failure:** -15 points (heavier penalty to discourage failures)
- **Inactivity decay:** -1 point per week of no activity
- **Range:** 0–1000
- **Tiers:** Unverified (0–199) → Newcomer (200–399) → Trusted (400–599) → Reliable (600–799) → Elite (800–1000)

---

## 🎨 Design System

Apple-inspired dark UI with:
- **Colors:** Deep black (#000), pulse green (#30D158), accent blue (#0A84FF)
- **Typography:** SF Pro Display, system-ui fallback
- **Effects:** Glassmorphism cards, mesh gradient backgrounds, CSS animations
- **Layout:** Generous whitespace, card-based components, mobile-responsive

---

## 🗂️ Project Structure

```
kite-pulse/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with providers
│   │   ├── page.tsx            # Dashboard (score + stats)
│   │   ├── marketplace/page.tsx # Service marketplace
│   │   └── profile/page.tsx    # Agent profile
│   ├── components/
│   │   ├── ConnectButton.tsx   # Wallet connection
│   │   ├── Navbar.tsx          # Navigation bar
│   │   ├── PulseScoreRing.tsx  # Score visualization
│   │   ├── Providers.tsx       # wagmi/query providers
│   │   └── ...
│   ├── hooks/
│   │   └── useAgentData.ts     # Contract read hooks
│   └── lib/
│       ├── web3.ts             # Chain config, ABI, contract addresses
│       └── config.ts           # Score tiers
├── contracts/
│   └── PulseScore.sol          # Smart contract
├── scripts/
│   ├── deploy-ethers.js        # Contract deployment
│   └── agent.js                # Autonomous agent script
├── hardhat.config.js           # Hardhat config
├── .env.example                # Environment template
└── README.md
```

---

## 🔐 Security

- **No hardcoded keys** — all secrets in `.env` (gitignored)
- **Reentrancy guards** on all state-changing contract functions
- **Access control** — only verifiers can record transactions
- **Rate limiting** — minimum 1 minute between transactions per agent
- **Score bounds** — scores clamped to 0–1000 range

---

## 🏆 Judging Criteria Alignment

| Criteria | How KitePulse Scores |
|----------|---------------------|
| **Agent Autonomy** | Agent script runs autonomously — discovers services, pays with USDC, records attestations. Zero human intervention after session approval. |
| **Developer Experience** | One-command setup, Apple-quality UI, comprehensive README, 2-min demo video. |
| **Real-World Applicability** | Every agent on Kite needs reputation. Service providers need trust signals. This is infrastructure for the agent economy. |
| **Novel/Creativity** | First on-chain reputation system for AI agents. Credit score meets agent economy. |

---

## 📚 Resources

- [Kite Agent Passport Docs](https://docs.gokite.ai/kite-agent-passport/beginner-setup)
- [Kite Chain Network Info](https://docs.gokite.ai/kite-chain/1-getting-started/network-information)
- [AA SDK (Gasless)](https://docs.gokite.ai/kite-chain/account-abstraction-sdk)
- [x402 Protocol](https://docs.gokite.ai/kite-chain/9-gasless-integration)
- [Encode Club Hackathon](https://www.encodeclub.com/programmes/kites-hackathon-ai-agentic-economy)

---

## 📝 License

MIT

---

*"The best time to build a credit score was before the lending boom. The best time to build agent reputation is before the agent economy explodes."*
