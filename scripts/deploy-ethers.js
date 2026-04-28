import { ethers } from "ethers";
import fs from "fs";

const RPC_URL = "https://rpc-testnet.gokite.ai";
const PRIVATE_KEY = "0x6056187844c5b4d9bc4313c216152cf3f068d99c4abbd835ac4364caacd8c577";

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log("Deployer:", wallet.address);
  const balance = await provider.getBalance(wallet.address);
  console.log("Balance:", ethers.formatEther(balance), "KITE");

  // Load contract artifacts
  const artifact = JSON.parse(
    fs.readFileSync("artifacts/contracts/PulseScore.sol/PulseScore.json", "utf8")
  );

  console.log("\nDeploying PulseScore...");
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const addr = await contract.getAddress();
  console.log("✅ PulseScore deployed to:", addr);
  console.log("🔗 Explorer: https://explorer-testnet.gokite.ai/address/" + addr);

  // Save the address
  fs.writeFileSync("deployed-address.txt", addr);
  console.log("Address saved to deployed-address.txt");
}

main().catch((e) => { console.error(e); process.exit(1); });
