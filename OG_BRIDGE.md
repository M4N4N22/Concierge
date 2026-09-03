# Concierge — 0G Bridge Buildathon

**Program:** [0G Bridge by AKINDO](https://app.akindo.io/wave-hacks/Z4MlX4vreI72ol6pd)  
**One-liner:** Personal Agentic ID — one private vault, vault-grounded chat, tradeable on-chain identity on 0G Storage, Compute, and Chain.  
**Branch (Wave 3):** `wave3_2026`

## Problem

Personal data is scattered. Generic AI cannot use it privately. Users do not own their intelligence as an asset.

## Solution

Concierge stores documents on **0G Storage**, processes them with **0G Compute**, registers ownership on **0G Chain**, mints an **Agentic ID**, and lets that ID be sold or rented via **AgentMarketplace**. Wave 4+ extends this with **lend access** (use my Concierge without my private files), specialists, and trading assist.

## 0G components

| Component | Role in Concierge |
|-----------|-------------------|
| **0G Storage** | File + insight persistence |
| **0G Compute** | Private Computer Router (operator pool) + Direct SDK fallback |
| **0G Chain** | `Vault.sol`, `INFTAgent.sol`, `AgentMarketplace.sol` |
| **Agentic ID** | Portable personality bound to the vault |

## Mainnet contracts

| Contract | Address |
|----------|---------|
| Vault | `0x02AEA2c7E88E2e96CD4A02Ff3BA54f90520893c8` |
| Agentic ID | `0x721c164D1c7e67e522d50194C342006E36Fde05f` |
| AgentMarketplace | `0x5cbAdD85bb8f96d8c5b43c7Ae18819F29Cc121Ac` |

- [Marketplace deploy](https://explorer.0g.ai/mainnet/blockchain/txns/0x73cc238c678a7932e76b5d0e6e59204930bcd14a56ada482088762ea984c1d9e/overview)  
- [Storage proof (file)](https://storagescan.0g.ai/submission/212383)  
- Live loop txs (mint · store · compute on mainnet): [0xbb9f…4437](https://explorer.0g.ai/mainnet/blockchain/txns/0xbb9fa5e58431daa454d4b64b0b8ad68b051799f9c5b71153bf999a1267224437/overview) · [0xddd9…d83e](https://explorer.0g.ai/mainnet/blockchain/txns/0xddd9adb2556866df18dd562185ca86f461db905274d792f55809d1ea4bbcd83e/overview) · [0x2679…6871](https://explorer.0g.ai/mainnet/blockchain/txns/0x26797bfb03bcb54e6729648004f8e25fac5cc984b60e1c11aa898b5591906871/overview) · [0x8f07…f625](https://explorer.0g.ai/mainnet/blockchain/txns/0x8f0777e23d63db8b7f167b30efb87f4629be5e927dcf14b1166f140a1526f625/overview) · [0x95ab…d14c](https://explorer.0g.ai/mainnet/blockchain/txns/0x95ab2eb95d3d9225c4315dcecb02f92e8cec0770a7a5430480d75bcc3b67d14c/overview)  
- Live: [concierge-sigma.vercel.app](http://concierge-sigma.vercel.app/)

**Sharing proofs:** StorageScan submission + explorer.0g.ai tx overview links — [OG_BRIDGE_WAVE3.md § Live Concierge loop](./OG_BRIDGE_WAVE3.md#live-concierge-loop-mainnet-product-activity).

Full Galileo + mainnet address tables, explorer txs, and file-level integration proof → [OG_BRIDGE_WAVE3.md](./OG_BRIDGE_WAVE3.md).

## Wave roadmap

| Wave | Status | Focus |
|------|--------|--------|
| **1** | Done | Scoping, SDKs, journey UX — [WAVE1_UPDATES.md](./WAVE1_UPDATES.md) |
| **2** | Done | Testnet demo + video |
| **3** | **Current** | Mainnet marketplace, operator compute, vault chat, specialist foundation — [OG_BRIDGE_WAVE3.md](./OG_BRIDGE_WAVE3.md) |
| **4** | **Next** | Production polish + lend access + specialists + trade assist |
| **5** | After | Demo Day (Token2049 Singapore) + finance/strategies depth |

### After Wave 3

**Wave 4** — harden for production; ship **lend access** (timed use without sharing private files — foundation in `lib/lendAccess/`); activate specialists where useful; polish Trading desk assist.  
**Wave 5** — Demo Day narrative; deeper trade assist; ERC-7857 + partner ID story.

Product vision and architecture diagram → [README.md](./README.md).

## Setup

```bash
npm install --legacy-peer-deps
cp .env.example .env
npm run dev
```

## Links

- [0G Docs](https://docs.0g.ai/) · [Agentic ID](https://docs.0g.ai/concepts/agentic-id)  
- [Demo video](https://youtu.be/PY_HBcew6oM) · [X thread](https://x.com/mananbuilds/status/1985758895386800449)
