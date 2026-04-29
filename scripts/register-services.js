import { ethers } from "ethers";
import fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();

const RPC_URL = process.env.NEXT_PUBLIC_KITE_RPC_URL || "https://rpc-testnet.gokite.ai";
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_PULSE_SCORE_ADDRESS;

if (!PRIVATE_KEY) {
  console.error("❌ Set DEPLOYER_PRIVATE_KEY in .env");
  process.exit(1);
}

if (!CONTRACT_ADDRESS) {
  console.error("❌ Set NEXT_PUBLIC_PULSE_SCORE_ADDRESS in .env");
  process.exit(1);
}

// Services to register on-chain (prices in USDC 18-decimal units)
const USDC_DECIMALS = 18;
const D = 10n ** BigInt(USDC_DECIMALS);
const SERVICES = [
  { name: "GPT-4 Turbo Inference", description: "High-performance LLM inference API via OpenRouter", endpoint: "https://api.openrouter.ai/v1/chat", price: 3n * D / 100n, minScore: 0n },      // $0.03
  { name: "Claude 3.5 Sonnet", description: "Advanced reasoning and coding assistant", endpoint: "https://api.anthropic.com/v1/messages", price: 15n * D / 1000n, minScore: 200n },           // $0.015
  { name: "Real-time Price Feeds", description: "On-chain price oracle data feeds", endpoint: "https://data.chain.link/api/prices", price: 1n * D / 10n, minScore: 400n },                    // $0.10
  { name: "GPU Render (A100)", description: "Distributed GPU rendering compute", endpoint: "https://render.network/api/gpu", price: 12n * D / 10n, minScore: 500n },                           // $1.20
  { name: "Premium IPFS Pinning", description: "Decentralized file storage pinning", endpoint: "https://pinata.cloud/api/pin", price: 5n * D / 100n, minScore: 300n },                       // $0.05
  { name: "Whisper v3 Large", description: "Speech-to-text transcription API", endpoint: "https://replicate.com/api/whisper", price: 25n * D / 1000n, minScore: 0n },                        // $0.025
  { name: "DALL-E 3 HD", description: "High-resolution image generation", endpoint: "https://api.openai.com/v1/images", price: 8n * D / 100n, minScore: 600n },                                // $0.08
  { name: "Stable Video Diffusion", description: "AI video generation from images", endpoint: "https://replicate.com/api/svd", price: 15n * D / 100n, minScore: 800n },                       // $0.15
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log("Deployer:", wallet.address);
  const balance = await provider.getBalance(wallet.address);
  console.log("KITE Balance:", ethers.formatEther(balance), "KITE\n");

  const artifact = JSON.parse(
    fs.readFileSync("artifacts/contracts/PulseScore.sol/PulseScore.json", "utf8")
  );
  const contract = new ethers.Contract(CONTRACT_ADDRESS, artifact.abi, wallet);

  // Check current service count
  // Register deployer as agent first (required for registerService)
  const deployerAgent = await contract.agents(wallet.address);
  if (!deployerAgent.exists) {
    console.log("Registering deployer as agent...");
    const tx = await contract.registerAgent(wallet.address);
    await tx.wait();
    console.log("✅ Deployer registered as agent\n");
  } else {
    console.log("Deployer already registered as agent\n");
  }

  const currentCount = await contract.getServiceCount();
  console.log("Current services registered:", currentCount.toString());

  if (Number(currentCount) >= SERVICES.length) {
    console.log("\n✅ All services already registered. Skipping.");
    return;
  }

  for (let i = Number(currentCount); i < SERVICES.length; i++) {
    const svc = SERVICES[i];
    console.log(`\n[${i + 1}/${SERVICES.length}] Registering: ${svc.name}...`);
    console.log(`  Price: ${ethers.formatUnits(svc.price, USDC_DECIMALS)} USDC | MinScore: ${svc.minScore}`);

    try {
      const tx = await contract.registerService(
        svc.name,
        svc.description,
        svc.endpoint,
        svc.price,
        svc.minScore
      );
      console.log(`  Tx: ${tx.hash}`);
      await tx.wait();
      console.log(`  ✅ Confirmed`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ❌ Failed: ${msg.slice(0, 200)}`);
    }
  }

  const newCount = await contract.getServiceCount();
  console.log(`\n✅ Done. Total services: ${newCount.toString()}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
