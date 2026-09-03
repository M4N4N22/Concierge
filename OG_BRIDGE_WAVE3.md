# Concierge — 0G Bridge Wave 3

**Branch:** `wave3_2026`  
**Program:** [0G Bridge by AKINDO](https://app.akindo.io/wave-hacks/Z4MlX4vreI72ol6pd)  
**App:** [concierge-sigma.vercel.app](http://concierge-sigma.vercel.app/)

Wave 3 takes Concierge from a vault/insights demo to a **mainnet-complete Agentic ID product**: operator-funded 0G Compute (Private Computer Router), vault-grounded chat, and an on-chain marketplace for sale and timed rentals.

---

## Minimum requirements

| Requirement | Proof |
|-------------|--------|
| **0G mainnet contract addresses** | Vault, Agentic ID, and AgentMarketplace below (all live on chain `16661`) |
| **Explorer links with on-chain activity** | Chainscan txs for marketplace deploy + proxy upgrades (mainnet) and vault/agent usage (Galileo) |
| **0G component integrated** | **0G Chain** (contracts), **0G Storage** (indexer upload), **0G Compute** (Router + Direct SDK) — files listed in [Integration proof](#integration-proof-0g-components) |

---

## 0G contract addresses

### Mainnet (Aristotle, chain `16661`)

| Contract | Address | Explorer |
|----------|---------|----------|
| **Vault** (proxy, upgraded Wave 3) | `0x02AEA2c7E88E2e96CD4A02Ff3BA54f90520893c8` | [Chainscan](https://chainscan.0g.ai/address/0x02AEA2c7E88E2e96CD4A02Ff3BA54f90520893c8) |
| **Agentic ID / INFTAgent** (proxy, upgraded Wave 3) | `0x721c164D1c7e67e522d50194C342006E36Fde05f` | [Chainscan](https://chainscan.0g.ai/address/0x721c164D1c7e67e522d50194C342006E36Fde05f) |
| **AgentMarketplace** (new Wave 3 deploy) | `0x5cbAdD85bb8f96d8c5b43c7Ae18819F29Cc121Ac` | [Chainscan](https://chainscan.0g.ai/address/0x5cbAdD85bb8f96d8c5b43c7Ae18819F29Cc121Ac) |
| Vault implementation (current) | `0x73aE6D1c8db1f78D2b2639AB133632fCA3a8Db5B` | [Chainscan](https://chainscan.0g.ai/address/0x73aE6D1c8db1f78D2b2639AB133632fCA3a8Db5B) |
| INFTAgent implementation (current) | `0x8775b29551FD1C640d9882130f8ADedA8B9D5C54` | [Chainscan](https://chainscan.0g.ai/address/0x8775b29551FD1C640d9882130f8ADedA8B9D5C54) |
| Marketplace treasury (2.5% fee) | `0x84948e317d312dD1808B49C280F814410E4De779` | [Chainscan](https://chainscan.0g.ai/address/0x84948e317d312dD1808B49C280F814410E4De779) |

RPC: `https://evmrpc.0g.ai` · Explorer: `https://chainscan.0g.ai`

### Galileo testnet (chain `16602`)

| Contract | Address | Explorer |
|----------|---------|----------|
| **Vault** | `0x845Dc38fCe646C1F0FeB5b607B069D6A62537B81` | [Chainscan Galileo](https://chainscan-galileo.0g.ai/address/0x845Dc38fCe646C1F0FeB5b607B069D6A62537B81) |
| **Agentic ID / INFTAgent** | `0x7fE958CaF70cdcEC187f30A216924878e2D89389` | [Chainscan Galileo](https://chainscan-galileo.0g.ai/address/0x7fE958CaF70cdcEC187f30A216924878e2D89389) |
| **AgentMarketplace** | `0x2DfB5d4459a6ebda06ffBBec03F44a0d714b209c` | [Chainscan Galileo](https://chainscan-galileo.0g.ai/address/0x2DfB5d4459a6ebda06ffBBec03F44a0d714b209c) |

RPC: `https://evmrpc-testnet.0g.ai` · Explorer: `https://chainscan-galileo.0g.ai`

---

## On-chain activity

### Mainnet (0G Chain)

| What | Transaction | Link |
|------|-------------|------|
| **AgentMarketplace deployed** (Wave 3) | `0x73cc238c678a7932e76b5d0e6e59204930bcd14a56ada482088762ea984c1d9e` | [tx](https://explorer.0g.ai/mainnet/blockchain/txns/0x73cc238c678a7932e76b5d0e6e59204930bcd14a56ada482088762ea984c1d9e/overview) |
| **Vault implementation deployed** | `0xf681b64b1f588159aa365399d5f88b4456def9b0e0312ef65f1ee6a7726ec3b9` | [tx](https://explorer.0g.ai/mainnet/blockchain/txns/0xf681b64b1f588159aa365399d5f88b4456def9b0e0312ef65f1ee6a7726ec3b9/overview) |
| **Vault proxy upgraded** (`Upgraded`) | `0xa48aafc9e693b5ea7add66dcb95bd3dd2737610e5e04219a8c8c6ee537550028` | [tx](https://explorer.0g.ai/mainnet/blockchain/txns/0xa48aafc9e693b5ea7add66dcb95bd3dd2737610e5e04219a8c8c6ee537550028/overview) |
| **INFTAgent implementation deployed** | `0xe5d0a664340f195ce3a5b300bfb70524897eb6cb98c7c3b258137d6b793426b2` | [tx](https://explorer.0g.ai/mainnet/blockchain/txns/0xe5d0a664340f195ce3a5b300bfb70524897eb6cb98c7c3b258137d6b793426b2/overview) |
| **INFTAgent proxy upgraded** (`Upgraded`) | `0xf81bbaea7d4e143f407bfc68e34a3fbbeae7670c19ada9f4735b36e8e0a8ad75` | [tx](https://explorer.0g.ai/mainnet/blockchain/txns/0xf81bbaea7d4e143f407bfc68e34a3fbbeae7670c19ada9f4735b36e8e0a8ad75/overview) |
| **0G Storage submission** (Flow contract) | `0x38514d5a60791416d70e05657ee2802997049aa4a2046ee93fd4e44fb8a50c18` | [tx](https://explorer.0g.ai/mainnet/blockchain/txns/0x38514d5a60791416d70e05657ee2802997049aa4a2046ee93fd4e44fb8a50c18/overview) |
| **0G Storage proof (file)** | Submission **#212383** | [StorageScan](https://storagescan.0g.ai/submission/212383) |
| Earlier storage sample | Submission #7322 | [StorageScan](https://storagescan.0g.ai/submission/7322) |
| Vault proxy creation (original) | `0x91e50f18f8f1a6ae82b5c60a296959d45e706625f88e926880064c21af75a546` | [tx](https://explorer.0g.ai/mainnet/blockchain/txns/0x91e50f18f8f1a6ae82b5c60a296959d45e706625f88e926880064c21af75a546/overview) |
| Agentic ID proxy creation (original) | `0x8eb101c6b87e90fb08e4ca43de9f13b93303ad27e9e63b23c4a83089472a458d` | [tx](https://explorer.0g.ai/mainnet/blockchain/txns/0x8eb101c6b87e90fb08e4ca43de9f13b93303ad27e9e63b23c4a83089472a458d/overview) |

Network-wide storage: [storagescan.0g.ai](https://storagescan.0g.ai) · Unified explorer: [explorer.0g.ai](https://explorer.0g.ai)

### Live Concierge loop (mainnet product activity)

End-to-end activity on **0G Mainnet** covering **Agentic ID mint**, **vault / storage registration**, and **compute-related on-chain steps** (store → run inference → write insights back to 0G). Share with this URL pattern:

`https://explorer.0g.ai/mainnet/blockchain/txns/{txHash}/overview`

| Role in loop | Tx | Explorer |
|--------------|-----|----------|
| Mainnet interaction | `0xbb9fa5e58431daa454d4b64b0b8ad68b051799f9c5b71153bf999a1267224437` | [overview](https://explorer.0g.ai/mainnet/blockchain/txns/0xbb9fa5e58431daa454d4b64b0b8ad68b051799f9c5b71153bf999a1267224437/overview) |
| Mainnet interaction | `0xddd9adb2556866df18dd562185ca86f461db905274d792f55809d1ea4bbcd83e` | [overview](https://explorer.0g.ai/mainnet/blockchain/txns/0xddd9adb2556866df18dd562185ca86f461db905274d792f55809d1ea4bbcd83e/overview) |
| Mainnet interaction | `0x26797bfb03bcb54e6729648004f8e25fac5cc984b60e1c11aa898b5591906871` | [overview](https://explorer.0g.ai/mainnet/blockchain/txns/0x26797bfb03bcb54e6729648004f8e25fac5cc984b60e1c11aa898b5591906871/overview) |
| Mainnet interaction | `0x8f0777e23d63db8b7f167b30efb87f4629be5e927dcf14b1166f140a1526f625` | [overview](https://explorer.0g.ai/mainnet/blockchain/txns/0x8f0777e23d63db8b7f167b30efb87f4629be5e927dcf14b1166f140a1526f625/overview) |
| Mainnet interaction | `0x95ab2eb95d3d9225c4315dcecb02f92e8cec0770a7a5430480d75bcc3b67d14c` | [overview](https://explorer.0g.ai/mainnet/blockchain/txns/0x95ab2eb95d3d9225c4315dcecb02f92e8cec0770a7a5430480d75bcc3b67d14c/overview) |

**Storage file proof (same loop):** [https://storagescan.0g.ai/submission/212383](https://storagescan.0g.ai/submission/212383)

### How to share proofs (Storage · Agentic ID · Compute)

Paste these into the AKINDO submission or demo notes.

| Layer | What to share | Where you get it |
|-------|---------------|------------------|
| **0G Storage** | [StorageScan #212383](https://storagescan.0g.ai/submission/212383) | After upload: [storagescan.0g.ai](https://storagescan.0g.ai) → submission sequence. Pattern: `https://storagescan.0g.ai/submission/{sequence}`. Also keep the **root hash** from My Files / server logs. |
| **Vault / Chain txs** | Explorer **overview** links | `https://explorer.0g.ai/mainnet/blockchain/txns/{txHash}/overview` — use for `addFile`, `updateInsights`, `mintAgent`, storage Flow submits, compute ledger/settlement. See [Live Concierge loop](#live-concierge-loop-mainnet-product-activity) above. |
| **Agentic ID mint** | Mint tx overview (+ optional NFT view) | Confirmed tx from Agentic ID UI / wallet. Contract: [INFTAgent](https://chainscan.0g.ai/address/0x721c164D1c7e67e522d50194C342006E36Fde05f). Token ID from tx `Transfer` logs → NFT tab on that contract. |
| **0G Compute** | On-chain twin of inference | Router inference itself is billed via [pc.0g.ai](https://pc.0g.ai) (catalog: [models](https://router-api.0g.ai/v1/models)). **On-chain proof you ran compute over vault files:** Storage submissions for category/summary blobs + Vault **`updateInsights`** (and any Direct SDK ledger/settlement txs) — included in the live loop txs above. |

**Demo bundle:** [StorageScan #212383](https://storagescan.0g.ai/submission/212383) + the five [live loop txs](#live-concierge-loop-mainnet-product-activity) + [Router models](https://router-api.0g.ai/v1/models).

### Galileo testnet

| What | Transaction | Link |
|------|-------------|------|
| **AgentMarketplace deployed** | `0x0f409f581959fc764a09f0071fb0943fdff4f8f9a598fe019cbe488d21878d83` | [tx](https://chainscan-galileo.0g.ai/tx/0x0f409f581959fc764a09f0071fb0943fdff4f8f9a598fe019cbe488d21878d83) |
| **Agentic ID interaction** (recent mint/update) | `0x9d20f969fac8e88f6e126daf21bd32b5b329b6fa3f4fffcee693e7bdc33054b4` | [tx](https://chainscan-galileo.0g.ai/tx/0x9d20f969fac8e88f6e126daf21bd32b5b329b6fa3f4fffcee693e7bdc33054b4) |
| **Vault interaction** (recent) | `0xea4d6f0b0933106f591eb60248c21932b2eef9a84036590c8db24ced3144e984` | [tx](https://chainscan-galileo.0g.ai/tx/0xea4d6f0b0933106f591eb60248c21932b2eef9a84036590c8db24ced3144e984) |
| **0G Storage upload** (Flow `0x22E03a6A…`) | `0x60d9755592bf56058e323bf91be3e0819224dd1a4da7c9af15dcf5bdb2d50048` | [tx](https://chainscan-galileo.0g.ai/tx/0x60d9755592bf56058e323bf91be3e0819224dd1a4da7c9af15dcf5bdb2d50048) |
| Vault proxy creation | `0x528573621465c47c4c774d3979b5bb9fbc30b54ac5d2c18d2387289757ec9962` | [tx](https://chainscan-galileo.0g.ai/tx/0x528573621465c47c4c774d3979b5bb9fbc30b54ac5d2c18d2387289757ec9962) |
| Agentic ID proxy creation | `0x894594e8062b33f5362f8cbad88cb35271d33c642142371bf2e7507ad5528f51` | [tx](https://chainscan-galileo.0g.ai/tx/0x894594e8062b33f5362f8cbad88cb35271d33c642142371bf2e7507ad5528f51) |

Network-wide storage activity: [storagescan-galileo.0g.ai](https://storagescan-galileo.0g.ai)

### 0G Compute (Router — live catalog)

Compute inference is billed through [0G Private Computer](https://pc.0g.ai) (`OG_ROUTER_API_KEY`), not a Chainscan contract call. Public proof the Router is the catalog Concierge consumes:

- Live models: [GET https://router-api.0g.ai/v1/models](https://router-api.0g.ai/v1/models)
- Client wiring: `lib/computeRouter.ts`, `lib/computeRouterModels.ts`, `lib/0gCompute.ts`

---

## Integration proof (0G components)

### 0G Chain

| Piece | File |
|-------|------|
| Chain-aware Vault / Agent / Marketplace addresses | `lib/addresses.ts` |
| Marketplace ABI + 2.5% fee | `lib/marketplaceAbi.ts`, `lib/marketplaceConstants.ts`, `contracts/Marketplace/AgentMarketplace.sol` |
| List / buy / rent / access | `hooks/useMarketplace.ts`, `lib/agentAccess.ts` |
| Vault + Agentic ID contracts | `contracts/Vault/Vault.sol`, `contracts/Agent/INFTAgent.sol` |
| Mainnet sync / deploy | `scripts/syncMainnetContracts.cjs`, `scripts/deployMarketplace.cjs` |

### 0G Storage

| Piece | File |
|-------|------|
| `@0gfoundation/0g-storage-ts-sdk` upload (Indexer + merkle root) | `lib/0gStorage.ts` |
| Upload API | `app/api/uploadFile/route.ts` |
| Insight blobs written back to Storage | `app/api/computeInsights/route.ts` |
| Chainscan / StorageScan helpers | `lib/explorer.ts` |

### 0G Compute

| Piece | File |
|-------|------|
| **Private Computer Router** (operator-funded, OpenAI-compatible) | `lib/computeRouter.ts`, `lib/computeOperator.ts` |
| Live model list + cheapest default | `lib/computeRouterModels.ts`, `app/api/compute/models/route.ts` |
| Direct SDK broker fallback | `lib/0gCompute.ts`, `lib/computeBroker.ts` (`@0gfoundation/0g-compute-ts-sdk`) |
| Chat, tips, knowledge feed, board | `app/api/chat/route.ts`, `app/api/chatTips/route.ts`, `app/api/computeInsights/route.ts`, `lib/board/orchestrate.ts` |
| Specialist personas (foundation) | `lib/specialists/*` |
| Lend access (foundation) | `lib/lendAccess/*`, `/dashboard/lend-access` |
| Trade assist / orchestration | `lib/trade/*`, `app/api/tradeSuggest/route.ts`, `app/api/tradeOrchestrate/route.ts` |
| Weekly chat/feed quotas + 1 tips inference / week | `lib/computeUsage.ts`, `lib/chatTipsQuota.ts`, `lib/boardAuth.ts` |
| Optional 0G Pay widget | `components/compute/ComputeTopUpPanel.tsx` |

---

## What shipped in Wave 3 (`wave3_2026`)

### Critical

1. **Mainnet marketplace** — `AgentMarketplace` deployed on Aristotle; app no longer pointed Galileo’s address at mainnet (that produced `getActiveRentIds` → `0x`).
2. **Vault + Agentic ID implementations upgraded** on mainnet proxies so bytecode matches current Solidity.
3. **Operator-funded compute** — testers chat and feed knowledge without creating a 0G Compute ledger. Concierge pays via Router (`OG_ROUTER_API_KEY` from [pc.0g.ai](https://pc.0g.ai)). Direct broker path remains for BYO ledger.
4. **Live Router catalog** — picker lists every OpenAI chat model on `GET /v1/models`; cheapest is selected (no stale `phala/…` IDs, no prompt-complexity Auto).

### Major

- **Journey is complete:** Vault → Knowledge base → Chat → Agentic ID → Ecosystem (sale / rent / transfer).
- **Chat** grounded in vault evidence; casual vs vault intent; personalized tips (1 Router call per wallet per week).
- **Weekly free quotas** — separate chat and feed pools (`COMPUTE_FREE_CHAT_WEEKLY_LIMIT` / `COMPUTE_FREE_FEED_WEEKLY_LIMIT`).
- **Agentic ID** personality (name, bio, vault fingerprint) with marketplace rentals that grant timed access without dumping Drive files.
- **TTL caches** on compute status, models, ledger, and quota so the dashboard does not hammer RPCs.
- **Specialist foundation** — soft personas under one Agentic ID (`lib/specialists/`). Wave 4+ can activate in Chat.
- **Lend access foundation** — timed use without sharing private files (`lib/lendAccess/`): share slices, access passes, use history. UI stub at `/dashboard/lend-access` (Soon). Full wire-up is Wave 4+.

---

## Lend access foundation (Wave 4+)

Let someone use your Concierge for a while **without** handing over private uploads. Today: data model + preview page only.

| File | Role |
|------|------|
| `lib/lendAccess/types.ts` | Share slices, access passes, use history |
| `lib/lendAccess/slices.ts` | Starter slices (writing / work vs private life) |
| `lib/lendAccess/grants.ts` | Draft / revoke / expire timed passes |
| `lib/lendAccess/history.ts` | Append use marks that grow Concierge history |
| `/dashboard/lend-access` | Coming-soon preview in the sidebar (above Trading) |

Today’s Ecosystem **Rent** remains the live marketplace rental. Lend access is the richer policy layer on top.

---

## Specialist foundation (Wave 4+)

One on-chain Agentic ID per wallet remains. Specialists are **runtime personas** that filter vault knowledge and inject a role prompt into 0G Compute.

| File | Role |
|------|------|
| `lib/specialists/types.ts` | `SpecialistDefinition`, `UserSpecialistPack`, `KnowledgeFilter` |
| `lib/specialists/catalog.ts` | Shipped templates (finance, trade, copywriter, travel, subscriptions) |
| `lib/specialists/knowledge.ts` | Filter vault items + `draftCustomSpecialist` |
| `lib/specialists/prompt.ts` | Build inference prompts for Router / Direct SDK |
| `lib/specialists/index.ts` | Public exports + `resolveSpecialist` |

Trading desk (`lib/trade/*`, `/dashboard/trading`) stays the secondary finance surface.

---

## Product spine

```
Vault (0G Storage + Vault.sol)
    → Knowledge (0G Compute categorize/summarize → Storage CIDs)
    → Chat (Router + vault evidence)
    → Agentic ID (INFTAgent.sol)
    → Ecosystem (sale / rent) · Lend access (Wave 4+)
    → Trading desk (assist, secondary)
```

---

## How to verify quickly

1. Open [StorageScan #212383](https://storagescan.0g.ai/submission/212383) — live mainnet file proof.
2. Open the [live Concierge loop txs](#live-concierge-loop-mainnet-product-activity) — mint + store + compute-related mainnet activity.
3. Open [mainnet marketplace](https://chainscan.0g.ai/address/0x5cbAdD85bb8f96d8c5b43c7Ae18819F29Cc121Ac) — creation tx `0x73cc238c…`.
4. Hit [Router models](https://router-api.0g.ai/v1/models) — same catalog Concierge uses in `lib/computeRouterModels.ts`.
5. Run the app on Mainnet: upload → feed → chat → mint (see [How to share proofs](#how-to-share-proofs-storage--agentic-id--compute)).

See [README.md](./README.md) for setup and vision. Program one-pager: [OG_BRIDGE.md](./OG_BRIDGE.md). Wave 1: [WAVE1_UPDATES.md](./WAVE1_UPDATES.md).
