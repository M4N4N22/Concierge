// scripts/deploy.cjs
require("dotenv").config();
const hre = require("hardhat");

async function main() {
  const { ethers, upgrades } = hre;

  console.log(" Deploying Vault and INFTAgent contracts...");

  // -----------------------------
  // Deploy Vault (Upgradeable)
  // -----------------------------
  const Vault = await ethers.getContractFactory("Vault");
  const vault = await upgrades.deployProxy(Vault, [process.env.DEPLOYER_ADDRESS], {
    initializer: "initialize",
  });
  await vault.waitForDeployment();
  console.log("Vault proxy deployed at:", await vault.getAddress());

  // -----------------------------
  // Deploy INFTAgent (Upgradeable)
  // -----------------------------
  const INFTAgent = await ethers.getContractFactory("INFTAgent");
  const inftAgent = await upgrades.deployProxy(INFTAgent, [process.env.DEPLOYER_ADDRESS], {
    initializer: "initialize",
  });
  await inftAgent.waitForDeployment();
  console.log("INFTAgent proxy deployed at:", await inftAgent.getAddress());

  // -----------------------------
  // Mint test agent
  // -----------------------------
  /*
  const vaultAddress = await vault.getAddress();
  const tx = await inftAgent.mintAgent(
    vaultAddress,
    ethers.encodeBytes32String("model_hash_v1"),
    "finance.ai",
    "0g://Qm123Test",
    "model_v1.0"
  );
  await tx.wait();
  console.log(" Minted first INFT Agent linked to vault:", vaultAddress);
  */

  console.log("\n Deployment complete!");
  console.log("Vault:", await vault.getAddress());
  console.log("INFTAgent:", await inftAgent.getAddress());
}

// deployment
main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(" Deployment error:", err);
    process.exit(1);
  });
