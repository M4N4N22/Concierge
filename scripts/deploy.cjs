const hre = require("hardhat");
const dotenv = require("dotenv");

// Auto-load correct env file based on network
const envFile = hre.network.name === "0gMainnet" ? "../.env.mainnet" : "../.env";
dotenv.config({ path: envFile });

async function main() {
  const { ethers, upgrades } = hre;
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with:", deployer.address);

  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "ETH");

  // -----------------------------
  // Deploy Vault (Upgradeable)
  // -----------------------------
  const Vault = await ethers.getContractFactory("Vault", deployer);
  console.log("Deploying Vault...");
  const vault = await upgrades.deployProxy(Vault, [process.env.DEPLOYER_ADDRESS], {
    initializer: "initialize",
  });

  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("Vault deployed at:", vaultAddress);

  // -----------------------------
  // Deploy INFTAgent (Upgradeable)
  // -----------------------------
  const INFTAgent = await ethers.getContractFactory("INFTAgent", deployer);
  console.log("Deploying INFTAgent...");
  const inftAgent = await upgrades.deployProxy(INFTAgent, [process.env.DEPLOYER_ADDRESS], {
    initializer: "initialize",
  });

  await inftAgent.waitForDeployment();
  const inftAgentAddress = await inftAgent.getAddress();
  console.log("INFTAgent deployed at:", inftAgentAddress);

  console.log("\nDeployment Summary:");
  console.log("Vault:", vaultAddress);
  console.log("INFTAgent:", inftAgentAddress);
}

main().catch((err) => {
  console.error("Deployment error:", err);
  process.exitCode = 1;
});
