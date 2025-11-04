const dotenv = require("dotenv");

const envFile =
  process.env.HARDHAT_NETWORK === "0gMainnet" ? ".env.mainnet" : ".env";

dotenv.config({ path: envFile });

require("@nomicfoundation/hardhat-ethers");
require("@openzeppelin/hardhat-upgrades");
require("@nomicfoundation/hardhat-verify");


module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    "0gGalileo": {
      url: process.env.GALILEO_RPC_URL || "https://evmrpc-testnet.0g.ai",
      chainId: 16602,
      accounts: [process.env.GALILEO_PRIVATE_KEY].filter(Boolean),
    },
    "0gMainnet": {
      url: process.env.OG_MAINNET_RPC_URL || "https://evmrpc.0g.ai",
      chainId: 16661,
      accounts: [process.env.OG_MAINNET_PRIVATE_KEY].filter(Boolean),
    },
  },
};
