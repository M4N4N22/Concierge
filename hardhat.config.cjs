require("@nomicfoundation/hardhat-ethers");
require("@openzeppelin/hardhat-upgrades"); 
require("dotenv").config();

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
      accounts: [process.env.GALILEO_PRIVATE_KEY],
    },
  },
};
