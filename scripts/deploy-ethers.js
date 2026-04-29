import { ethers } from "ethers";
import fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();

const RPC_URL = process.env.NEXT_PUBLIC_KITE_RPC_URL || "https://rpc-testnet.gokite.ai";
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS || "0x0fF5393387ad2f9f691FD6Fd28e07E3969e27e63";

if (!PRIVATE_KEY) {
  console.error("❌ Set DEPLOYER_PRIVATE_KEY in .env");
  process.exit(1);
}

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log("Deployer:", wallet.address);
  const balance = await provider.getBalance(wallet.address);
  console.log("Balance:", ethers.formatEther(balance), "KITE");

  const artifact = JSON.parse(
    fs.readFileSync("artifacts/contracts/PulseScore.sol/PulseScore.json", "utf8")
  );

  console.log("\nDeploying PulseScore with USDC:", USDC_ADDRESS);
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const contract = await factory.deploy(USDC_ADDRESS);
  await contract.waitForDeployment();

  const addr = await contract.getAddress();
  console.log("✅ PulseScore deployed to:", addr);
  console.log("🔗 Explorer:", `https://testnet.kitescan.ai/address/${addr}`);

  fs.writeFileSync("deployed-address.txt", addr);
  console.log("Address saved to deployed-address.txt");
}

main().catch((e) => { console.error(e); process.exit(1); });
