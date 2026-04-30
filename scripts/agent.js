#!/usr/bin/env node

/**
 * Sibyl Agent — Autonomous AI Agent on Kite Chain
 *
 * This script demonstrates an autonomous agent that:
 * 1. Connects to PulseScore on Kite Testnet
 * 2. Registers as an agent if not already registered
 * 3. Discovers services from the on-chain registry
 * 4. Requests and settles x402 payments via gasless or direct tx
 * 5. Tracks reputation score growth
 *
 * Usage:
 *   node scripts/agent.js [--dry-run] [--count N]
 *
 * Prerequisites:
 *   - DEPLOYER_PRIVATE_KEY in .env
 *   - NEXT_PUBLIC_PULSE_SCORE_ADDRESS in .env
 *   - Wallet funded with USDC and KITE on testnet
 */

import { ethers } from "ethers";
import fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();

// ─── Config ───

const RPC_URL = process.env.NEXT_PUBLIC_KITE_RPC_URL || "https://rpc-testnet.gokite.ai";
const PULSE_SCORE_ADDRESS = process.env.NEXT_PUBLIC_PULSE_SCORE_ADDRESS;
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
const DRY_RUN = process.argv.includes("--dry-run");
const TXN_COUNT = parseInt(process.argv.find((_, i, a) => a[i - 1] === "--count") || "3");

// ─── Helpers ───

function log(msg) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] ${msg}`);
}

// ─── Main Agent Loop ───

async function main() {
  log("🤖 Sibyl Agent starting...");
  log(`   Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"}`);
  log(`   Max transactions: ${TXN_COUNT}`);

  if (!PULSE_SCORE_ADDRESS) {
    console.error("❌ NEXT_PUBLIC_PULSE_SCORE_ADDRESS not set");
    process.exit(1);
  }
  if (!PRIVATE_KEY) {
    console.error("❌ DEPLOYER_PRIVATE_KEY not set");
    process.exit(1);
  }

  // Connect to Kite chain
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  log(`   Wallet: ${wallet.address}`);

  const balance = await provider.getBalance(wallet.address);
  log(`   KITE Balance: ${ethers.formatEther(balance)} KITE`);

  // Load contract
  const artifact = JSON.parse(
    fs.readFileSync("artifacts/contracts/PulseScore.sol/PulseScore.json", "utf8")
  );
  const contract = new ethers.Contract(PULSE_SCORE_ADDRESS, artifact.abi, wallet);

  // Check agent registration
  let agent = await contract.getAgent(wallet.address);

  if (!agent.exists) {
    log("⚠️  Agent not registered. Registering...");
    if (!DRY_RUN) {
      const tx = await contract.registerAgent(wallet.address);
      await tx.wait();
      log("✅ Agent registered on-chain");
      agent = await contract.getAgent(wallet.address);
    } else {
      log("   (dry run — would register)");
    }
  } else {
    log(`   Agent score: ${agent.score.toString()}`);
    log(`   Transactions: ${agent.totalTxns.toString()}`);
    log(`   Session remaining: $${ethers.formatUnits(agent.sessionBudget - agent.sessionSpent, 18)} USDC`);
  }

  // Discover services
  log("\n📡 Discovering services...");
  const serviceCount = await contract.getServiceCount();
  log(`   ${serviceCount} services found on-chain`);

  const services = [];
  for (let i = 1; i <= Number(serviceCount); i++) {
    try {
      const svc = await contract.getService(i);
      if (svc.exists) {
        services.push({
          id: i,
          name: svc.name,
          provider: svc.provider,
          price: svc.price,
          minScore: Number(svc.minScore),
        });
      }
    } catch {
      // skip
    }
  }

  if (services.length === 0) {
    log("❌ No services available. Run scripts/register-services.js first.");
    process.exit(1);
  }

  // Filter services the agent can afford and access
  const affordable = services.filter(
    (s) => s.minScore <= Number(agent.score) && s.price <= agent.sessionBudget - agent.sessionSpent
  );

  if (affordable.length === 0) {
    log("⚠️  No affordable services match agent score/session. Refresh session or increase score.");
    process.exit(0);
  }

  log(`   ${affordable.length} services accessible to this agent`);

  // Execute paid actions
  log("\n💰 Executing x402 settlements...\n");

  let successCount = 0;
  for (let i = 0; i < Math.min(TXN_COUNT, affordable.length); i++) {
    const svc = affordable[i % affordable.length];
    const priceFormatted = ethers.formatUnits(svc.price, 18);
    log(`[${i + 1}/${TXN_COUNT}] ${svc.name} — $${priceFormatted} USDC`);

    if (DRY_RUN) {
      log(`   (dry run — would request + settle service #${svc.id})`);
      successCount++;
      continue;
    }

    // Step 1: Request service (x402 step 1)
    try {
      log(`   → requestService(${svc.id}, ${wallet.address})`);
      const reqTx = await contract.requestService(svc.id, wallet.address);
      await reqTx.wait();
      log(`   ✓ Service requested`);
    } catch (e) {
      log(`   ✗ Request failed: ${e.reason || e.message?.slice(0, 80)}`);
      continue;
    }

    // Step 2: Settle payment (x402 step 2)
    try {
      log(`   → settlePayment(${svc.id}, ${wallet.address}, true)`);
      const settleTx = await contract.settlePayment(svc.id, wallet.address, true);
      const receipt = await settleTx.wait();
      log(`   ✓ Payment settled. Tx: ${receipt.hash.slice(0, 14)}...`);
      successCount++;
    } catch (e) {
      log(`   ✗ Settlement failed: ${e.reason || e.message?.slice(0, 80)}`);
    }

    // Rate limiting (respect MIN_TXN_INTERVAL = 10s)
    if (i < Math.min(TXN_COUNT, affordable.length) - 1) {
      log(`   ⏳ Waiting 12s for MIN_TXN_INTERVAL...`);
      await new Promise((r) => setTimeout(r, 12000));
    }
  }

  // Final status
  const finalAgent = await contract.getAgent(wallet.address);
  log("\n📊 Final Status:");
  log(`   Score: ${finalAgent.score.toString()} (was ${agent.score.toString()})`);
  log(`   Transactions: ${finalAgent.totalTxns.toString()}`);
  log(`   Success Rate: ${finalAgent.totalTxns > 0 ? ((Number(finalAgent.successTxns) / Number(finalAgent.totalTxns)) * 100).toFixed(1) : 0}%`);
  log(`   Total Spent: $${ethers.formatUnits(finalAgent.totalSpent, 18)} USDC`);
  log(`   Session Left: $${ethers.formatUnits(finalAgent.sessionBudget - finalAgent.sessionSpent, 18)} USDC`);
  log(`\n✅ Agent run complete — ${successCount} successful settlements`);
}

main().catch((e) => {
  console.error("❌ Agent failed:", e.message);
  process.exit(1);
});
