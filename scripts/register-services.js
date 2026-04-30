import { ethers } from "ethers";
import fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();

const RPC_URL = "https://rpc-testnet.gokite.ai";
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
const CONTRACT_ADDRESS = fs.readFileSync("deployed-address.txt", "utf8").trim();
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS;

if (!PRIVATE_KEY) {
  console.error("❌ DEPLOYER_PRIVATE_KEY not set");
  process.exit(1);
}

const artifact = JSON.parse(
  fs.readFileSync("artifacts/contracts/PulseScore.sol/PulseScore.json", "utf8")
);

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, artifact.abi, wallet);

const services = [
  { name: "GPT-4 Turbo Inference", desc: "High-performance LLM inference via OpenAI API", endpoint: "https://api.openai.com/v1/chat/completions", price: "0.03", minScore: 0 },
  { name: "Claude 3.5 Sonnet", desc: "Anthropic Claude reasoning and coding assistant", endpoint: "https://api.anthropic.com/v1/messages", price: "0.015", minScore: 200 },
  { name: "Real-time Price Feeds", desc: "onchain price oracle for DeFi protocols", endpoint: "https://api.coingecko.com/api/v3/simple/price", price: "0.10", minScore: 0 },
  { name: "GPU Render (A100)", desc: "High-performance GPU compute for ML training and rendering", endpoint: "https://gpu.gokite.ai/v1/render", price: "1.20", minScore: 500 },
  { name: "Premium IPFS Pinning", desc: "Permanent decentralized storage with premium pinning", endpoint: "https://ipfs.gokite.ai/api/v0/pin", price: "0.05", minScore: 0 },
  { name: "Whisper v3 Large", desc: "State-of-the-art speech-to-text transcription", endpoint: "https://api.openai.com/v1/audio/transcriptions", price: "0.025", minScore: 0 },
  { name: "DALL-E 3 HD", desc: "High-resolution AI image generation", endpoint: "https://api.openai.com/v1/images/generations", price: "0.08", minScore: 300 },
  { name: "Stable Video Diffusion", desc: "AI-powered video generation from text or images", endpoint: "https://api.stability.ai/v2beta/video", price: "0.15", minScore: 400 },
];

async function main() {
  console.log("Deployer:", wallet.address);

  // Step 1: Register deployer as agent
  console.log("\n[1/9] Registering deployer as agent...");
  try {
    const tx = await contract.registerAgent(wallet.address);
    await tx.wait();
    console.log("✅ Deployer registered as agent");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("already registered")) {
      console.log("⚠️ Already registered");
    } else {
      console.error("❌ Registration failed:", msg);
      throw err;
    }
  }

  // Step 2-9: Register services
  for (let i = 0; i < services.length; i++) {
    const s = services[i];
    console.log(`\n[${i + 2}/9] Registering: ${s.name}...`);
    try {
      const priceWei = ethers.parseUnits(s.price, 18);
      const tx = await contract.registerService(s.name, s.desc, s.endpoint, priceWei, s.minScore);
      await tx.wait();
      console.log(`✅ Service #${i + 1} registered — ${s.name} ($${s.price})`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`❌ Failed to register ${s.name}:`, msg);
    }
  }

  // Verify
  const count = await contract.getServiceCount();
  console.log(`\n📊 Total services onchain: ${count}`);
  console.log(`🔗 Contract: https://testnet.kitescan.ai/address/${CONTRACT_ADDRESS}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
