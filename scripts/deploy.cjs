// scripts/deploy.cjs
require("dotenv").config();
const hre = require("hardhat");

async function main() {
  const { ethers } = hre;

  // --- Deploy Vault ---
  const Vault = await ethers.getContractFactory("Vault");
  const vault = await Vault.deploy(); // already deployed
  console.log("Vault deployed to:", vault.target);

  // --- Deploy AgentNFT ---
  const AgentNFT = await ethers.getContractFactory("AgentNFT");
  const agentNFT = await AgentNFT.deploy();
  console.log("AgentNFT deployed to:", agentNFT.target);

  // --- Optional: mint a first agent NFT ---
  // const tx = await agentNFT.mintAgent(
  //   vault.target,
  //   ethers.formatBytes32String("hash"),
  //   "finance"
  // );
  // await tx.wait();
  // console.log("Minted first agent NFT");
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
