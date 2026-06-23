# Concierge — 0G Bridge Buildathon (Wave 1)

**Program:** [0G Bridge by AKINDO](https://app.akindo.io/wave-hacks/Z4MlX4vreI72ol6pd)  
**One-liner:** Personal Agentic ID platform — one private vault, many domain agents, on 0G Storage, Compute, and Chain.

## Problem

Personal data is scattered across apps. Generic AI cannot use it privately. Users don't own their intelligence.

## Solution

Concierge ingests documents into an encrypted **0G Storage** vault, processes them with **0G Compute**, registers ownership on **0G Chain**, and mints a personal **Agentic ID** (ERC-7857 path) that powers finance, travel, and subscription domain agents from the same vault.

## 0G Components Used

| Component | How Concierge uses it |
|-----------|----------------------|
| **0G Storage** | Encrypted file + insight persistence (mainnet) |
| **0G Compute** | File categorization, summaries, domain recommendations |
| **0G Chain** | `Vault.sol` registry + `INFTAgent.sol` Agentic ID contract (mainnet) |
| **Agentic ID** | On-chain agent mint bound to user vault (ERC-7857 upgrade planned) |

## Architecture

```
User Dashboard (Next.js)
    → Upload → 0G Storage + Vault.sol
    → Insights → 0G Compute → Vault update
    → Mint → INFTAgent.sol (Agentic ID)
    → Domain agents → /api/agentRecommendations → 0G Compute
```

## Mainnet Deployment

| Contract | Address |
|----------|---------|
| Vault | `0x02AEA2c7E88E2e96CD4A02Ff3BA54f90520893c8` |
| Agentic ID (INFTAgent) | `0x721c164D1c7e67e522d50194C342006E36Fde05f` |

- [Storage proof on explorer](https://explorer.0g.ai/mainnet/storage/submissions/7322)
- Live demo: http://concierge-sigma.vercel.app/

## Wave Roadmap

| Wave | Goal | Concierge focus |
|------|------|-----------------|
| **1** (done) | Scoping + integration | SDK migration, journey UX, compute ledger flow, Agentic ID — see [WAVE1_UPDATES.md](./WAVE1_UPDATES.md) |
| **2** | Testnet demo + video | End-to-end demo, polish compute flow |
| **3** | Mainnet depth | ERC-7857 alignment, fresh on-chain activity |
| **4** | Traction | Users, X posts, metrics |
| **5** | Demo Day pitch | Token2049 Singapore, growth roadmap |

## Tech Stack (2026)

- **Frontend:** Next.js 15, React 19, wagmi, RainbowKit
- **0G SDKs:** `@0gfoundation/0g-storage-ts-sdk`, `@0gfoundation/0g-compute-ts-sdk`
- **Contracts:** Solidity 0.8.28, OpenZeppelin 5.6, Hardhat

## Setup

```bash
npm install --legacy-peer-deps
cp .env.example .env   # or use .env — fill private keys
npm run dev
```

See [README.md](./README.md) and [WAVE1_UPDATES.md](./WAVE1_UPDATES.md) for environment and feature details.

## Links

- [0G Docs](https://docs.0g.ai/)
- [Agentic ID](https://docs.0g.ai/concepts/agentic-id)
- [Demo video](https://youtu.be/PY_HBcew6oM)
- [X thread](https://x.com/mananbuilds/status/1985758895386800449)
