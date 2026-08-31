const hre = require("hardhat");
const dotenv = require("dotenv");

const envFile = hre.network.name === "0gMainnet" ? "../.env.mainnet" : "../.env";
dotenv.config({ path: envFile });

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

  console.log("Deployer:", deployer.address);
  console.log("Agent NFT:", agentAddress);

  const Factory = await ethers.getContractFactory("AgentMarketplace", deployer);
  const market = await Factory.deploy(agentAddress);
  await market.waitForDeployment();
  const addr = await market.getAddress();

  console.log("\nAgentMarketplace deployed at:", addr);
  console.log("Set in .env:");
  if (hre.network.name === "0gMainnet") {
    console.log(`NEXT_PUBLIC_MARKETPLACE_ADDRESS=${addr}`);
  } else {
    console.log(`NEXT_PUBLIC_MARKETPLACE_TESTNET_ADDRESS=${addr}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
