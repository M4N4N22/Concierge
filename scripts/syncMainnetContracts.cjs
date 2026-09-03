/**
 * Inspect + sync Concierge contracts on 0G Mainnet.
 * - Upgrade Vault / INFTAgent proxies only if implementation bytecode drifted
 * - Deploy AgentMarketplace if the configured mainnet address has no code
 *
 * Usage: npx hardhat run scripts/syncMainnetContracts.cjs --network 0gMainnet
 */
const hre = require("hardhat");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../.env") });

const MAINNET_VAULT =
  process.env.NEXT_PUBLIC_MAINNET_VAULT_ADDRESS ||
  process.env.VAULT_ADDRESS;
const MAINNET_AGENT =
  process.env.INFTAGENT_ADDRESS ||
  process.env.NEXT_PUBLIC_INFTAGENT_ADDRESS;
const MAINNET_MARKET =
  process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS;

function stripMetadata(bytecode) {
  const hex = bytecode.startsWith("0x") ? bytecode.slice(2) : bytecode;
  const marker = "a264697066735822";
  const idx = hex.lastIndexOf(marker);
  return idx === -1 ? hex : hex.slice(0, idx);
}

async function bytecodeMatches(provider, onChainAddr, artifactBytecode) {
  const live = await provider.getCode(onChainAddr);
  if (!live || live === "0x") return { live: false, match: false, liveBytes: 0 };
  const a = stripMetadata(live);
  const b = stripMetadata(artifactBytecode);
  return {
    live: true,
    match: a === b,
    liveBytes: (live.length - 2) / 2,
  };
}

async function main() {
  const { ethers, upgrades } = hre;
  if (hre.network.name !== "0gMainnet") {
    throw new Error("Run with --network 0gMainnet");
  }

  const [deployer] = await ethers.getSigners();
  const provider = deployer.provider;
  const balance = await provider.getBalance(deployer.address);
  console.log("Network:", hre.network.name, "chainId", hre.network.config.chainId);
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "OG");

  if (balance === 0n) {
    throw new Error("Deployer has 0 OG on mainnet");
  }

  if (!MAINNET_VAULT || !MAINNET_AGENT) {
    throw new Error("Set mainnet Vault / INFTAgent addresses in .env");
  }

  const Vault = await ethers.getContractFactory("Vault", deployer);
  const Agent = await ethers.getContractFactory("INFTAgent", deployer);

  const vaultImpl = await upgrades.erc1967.getImplementationAddress(MAINNET_VAULT);
  const agentImpl = await upgrades.erc1967.getImplementationAddress(MAINNET_AGENT);
  console.log("\nVault proxy:", MAINNET_VAULT);
  console.log("Vault impl: ", vaultImpl);
  console.log("Agent proxy:", MAINNET_AGENT);
  console.log("Agent impl: ", agentImpl);

  const vaultRuntime = await bytecodeMatches(
    provider,
    vaultImpl,
    (await hre.artifacts.readArtifact("Vault")).deployedBytecode
  );
  const agentRuntime = await bytecodeMatches(
    provider,
    agentImpl,
    (await hre.artifacts.readArtifact("INFTAgent")).deployedBytecode
  );

  console.log(
    "\nVault impl vs current source:",
    vaultRuntime.live ? (vaultRuntime.match ? "UP TO DATE" : "STALE") : "MISSING"
  );
  console.log(
    "Agent impl vs current source:",
    agentRuntime.live ? (agentRuntime.match ? "UP TO DATE" : "STALE") : "MISSING"
  );

  if (!vaultRuntime.match) {
    console.log("\nUpgrading Vault implementation…");
    const upgraded = await upgrades.upgradeProxy(MAINNET_VAULT, Vault);
    await upgraded.waitForDeployment();
    console.log(
      "Vault impl now:",
      await upgrades.erc1967.getImplementationAddress(MAINNET_VAULT)
    );
  }

  if (!agentRuntime.match) {
    console.log("\nUpgrading INFTAgent implementation…");
    const upgraded = await upgrades.upgradeProxy(MAINNET_AGENT, Agent);
    await upgraded.waitForDeployment();
    console.log(
      "Agent impl now:",
      await upgrades.erc1967.getImplementationAddress(MAINNET_AGENT)
    );
  }

  const marketCode = MAINNET_MARKET
    ? await provider.getCode(MAINNET_MARKET)
    : "0x";
  const marketMissing = !MAINNET_MARKET || marketCode === "0x";

  if (!marketMissing) {
    console.log("\nMarketplace already has code at", MAINNET_MARKET);
    return;
  }

  const treasury =
    process.env.MARKETPLACE_TREASURY ||
    process.env.DEPLOYER_ADDRESS ||
    deployer.address;
  const feeBps = Number(process.env.MARKETPLACE_FEE_BPS || "250");

  console.log("\nDeploying AgentMarketplace…");
  console.log("Agent NFT:", MAINNET_AGENT);
  console.log("Treasury: ", treasury);
  console.log("Fee bps:  ", feeBps);

  const Factory = await ethers.getContractFactory("AgentMarketplace", deployer);
  const market = await Factory.deploy(MAINNET_AGENT, treasury, feeBps);
  await market.waitForDeployment();
  const addr = await market.getAddress();

  console.log("\nAgentMarketplace deployed at:", addr);
  console.log("Set in .env:");
  console.log(`NEXT_PUBLIC_MARKETPLACE_ADDRESS=${addr}`);
  console.log(
    "Leave NEXT_PUBLIC_MARKETPLACE_TESTNET_ADDRESS as the Galileo deploy."
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
