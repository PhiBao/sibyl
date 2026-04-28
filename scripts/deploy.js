import hre from "hardhat";

async function main() {
  console.log("Deploying PulseScore to Kite testnet...");
  const pulseScore = await hre.ethers.deployContract("PulseScore");
  await pulseScore.waitForDeployment();
  const addr = await pulseScore.getAddress();
  console.log("✅ PulseScore deployed to:", addr);
  console.log("🔗 Explorer: https://explorer-testnet.gokite.ai/address/" + addr);
}

main().catch((e) => { console.error(e); process.exit(1); });
