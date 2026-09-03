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
| **AgentMarketplace deployed** (Wave 3) | `0x73cc238c678a7932e76b5d0e6e59204930bcd14a56ada482088762ea984c1d9e` | [tx](https://chainscan.0g.ai/tx/0x73cc238c678a7932e76b5d0e6e59204930bcd14a56ada482088762ea984c1d9e) |
| **Vault implementation deployed** | `0xf681b64b1f588159aa365399d5f88b4456def9b0e0312ef65f1ee6a7726ec3b9` | [tx](https://chainscan.0g.ai/tx/0xf681b64b1f588159aa365399d5f88b4456def9b0e0312ef65f1ee6a7726ec3b9) |
| **Vault proxy upgraded** (`Upgraded`) | `0xa48aafc9e693b5ea7add66dcb95bd3dd2737610e5e04219a8c8c6ee537550028` | [tx](https://chainscan.0g.ai/tx/0xa48aafc9e693b5ea7add66dcb95bd3dd2737610e5e04219a8c8c6ee537550028) |
| **INFTAgent implementation deployed** | `0xe5d0a664340f195ce3a5b300bfb70524897eb6cb98c7c3b258137d6b793426b2` | [tx](https://chainscan.0g.ai/tx/0xe5d0a664340f195ce3a5b300bfb70524897eb6cb98c7c3b258137d6b793426b2) |
| **INFTAgent proxy upgraded** (`Upgraded`) | `0xf81bbaea7d4e143f407bfc68e34a3fbbeae7670c19ada9f4735b36e8e0a8ad75` | [tx](https://chainscan.0g.ai/tx/0xf81bbaea7d4e143f407bfc68e34a3fbbeae7670c19ada9f4735b36e8e0a8ad75) |
| **0G Storage submission** (Flow contract) | `0x38514d5a60791416d70e05657ee2802997049aa4a2046ee93fd4e44fb8a50c18` | [tx](https://chainscan.0g.ai/tx/0x38514d5a60791416d70e05657ee2802997049aa4a2046ee93fd4e44fb8a50c18) |
| **0G StorageScan / submission #7322** | root `0xbfb478f0…adf31d` | [Storage explorer](https://explorer.0g.ai/mainnet/storage/submissions/7322) |
| Vault proxy creation (original) | `0x91e50f18f8f1a6ae82b5c60a296959d45e706625f88e926880064c21af75a546` | [tx](https://chainscan.0g.ai/tx/0x91e50f18f8f1a6ae82b5c60a296959d45e706625f88e926880064c21af75a546) |
| Agentic ID proxy creation (original) | `0x8eb101c6b87e90fb08e4ca43de9f13b93303ad27e9e63b23c4a83089472a458d` | [tx](https://chainscan.0g.ai/tx/0x8eb101c6b87e90fb08e4ca43de9f13b93303ad27e9e63b23c4a83089472a458d) |

Network-wide storage activity: [storagescan.0g.ai](https://storagescan.0g.ai)

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

1. Open [mainnet marketplace](https://chainscan.0g.ai/address/0x5cbAdD85bb8f96d8c5b43c7Ae18819F29Cc121Ac) — creation tx `0x73cc238c…`.
2. Open [Galileo vault](https://chainscan-galileo.0g.ai/address/0x845Dc38fCe646C1F0FeB5b607B069D6A62537B81) — recent `addFile` / insight txs.
3. Hit [Router models](https://router-api.0g.ai/v1/models) — same catalog Concierge uses in `lib/computeRouterModels.ts`.
4. Run the app, connect on Galileo or Mainnet, upload → feed → chat.

See [README.md](./README.md) for setup and vision. Program one-pager: [OG_BRIDGE.md](./OG_BRIDGE.md). Wave 1: [WAVE1_UPDATES.md](./WAVE1_UPDATES.md).
