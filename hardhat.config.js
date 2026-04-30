import "@nomicfoundation/hardhat-ethers";
import * as dotenv from "dotenv";
dotenv.config();

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
if (!PRIVATE_KEY) {
  throw new Error("DEPLOYER_PRIVATE_KEY not set in environment. Check your .env file.");
}

const config = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    kiteTestnet: {
      type: "http",
      url: "https://rpc-testnet.gokite.ai",
      chainId: 2368,
      accounts: [PRIVATE_KEY],
    },
    kiteMainnet: {
      type: "http",
      url: "https://rpc.gokite.ai",
      chainId: 2366,
      accounts: [PRIVATE_KEY],
    },
  },
};

export default config;
