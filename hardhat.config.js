import "@nomicfoundation/hardhat-ethers";

const config = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    kite: {
      type: "http",
      url: "https://rpc-testnet.gokite.ai",
      chainId: 2366,
      accounts: ["0x6056187844c5b4d9bc4313c216152cf3f068d99c4abbd835ac4364caacd8c577"],
    },
  },
};

export default config;
