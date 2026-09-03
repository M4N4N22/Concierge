const hre = require("hardhat");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });

async function main() {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();

  const agentAddress =
    hre.network.name === "0gMainnet"
      ? process.env.INFTAGENT_ADDRESS || process.env.NEXT_PUBLIC_INFTAGENT_ADDRESS
      : process.env.NEXT_PUBLIC_INFTAGENT_TESTNET_ADDRESS ||
        process.env.INFTAGENT_ADDRESS ||
        process.env.NEXT_PUBLIC_INFTAGENT_ADDRESS;

  if (!agentAddress) {
    throw new Error("Set INFTAGENT / NEXT_PUBLIC_INFTAGENT_* address before deploy");
  }

  const treasury =
    process.env.MARKETPLACE_TREASURY ||
    process.env.DEPLOYER_ADDRESS ||
    deployer.address;

  const feeBps = Number(process.env.MARKETPLACE_FEE_BPS || "250");
  if (!Number.isFinite(feeBps) || feeBps < 0 || feeBps > 1000) {
    throw new Error("MARKETPLACE_FEE_BPS must be 0–1000 (basis points, max 10%)");
  }

  console.log("Deployer:", deployer.address);
  console.log("Agent NFT:", agentAddress);
  console.log("Treasury:", treasury);
  console.log("Fee bps:", feeBps || "default 250 (2.5%)");

  const Factory = await ethers.getContractFactory("AgentMarketplace", deployer);
  const market = await Factory.deploy(agentAddress, treasury, feeBps);
  await market.waitForDeployment();
  const addr = await market.getAddress();

  console.log("\nAgentMarketplace deployed at:", addr);
  console.log("Set in .env:");
  if (hre.network.name === "0gMainnet") {
    console.log(`NEXT_PUBLIC_MARKETPLACE_ADDRESS=${addr}`);
  } else {
    console.log(`NEXT_PUBLIC_MARKETPLACE_TESTNET_ADDRESS=${addr}`);
  }
  console.log(`MARKETPLACE_TREASURY=${treasury}`);
  console.log(`MARKETPLACE_FEE_BPS=${feeBps || 250}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
