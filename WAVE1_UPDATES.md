# Concierge — Wave 1 Updates (0G Bridge Buildathon)

**Program:** [0G Bridge by AKINDO](https://app.akindo.io/wave-hacks/Z4MlX4vreI72ol6pd)  
**Status:** Wave 1 complete — scoping, SDK integration, Agentic ID positioning, and end-to-end testnet UX.

> Submission summary: [OG_BRIDGE.md](./OG_BRIDGE.md)  
> Full project docs: [README.md](./README.md)

---

## Wave 1 Goals (met)

| Goal | Deliverable |
|------|-------------|
| Modernize 0G SDKs | Migrated to `@0gfoundation/0g-storage-ts-sdk` and `@0gfoundation/0g-compute-ts-sdk` |
| Agentic ID positioning | Rebranded INFT → **Agentic ID** across UI and docs |
| Real compute integration | `/api/computeInsights`, `/api/agentRecommendations`, ledger + model APIs |
| Testnet-ready demo | Galileo-first wallet defaults, vault upload → insights → agent flow |
| Buildathon submission doc | `OG_BRIDGE.md` with architecture and contract addresses |

---

## What Shipped

### SDK & infrastructure

- **0G Storage:** `@0gfoundation/0g-storage-ts-sdk` ^1.2.10 — lazy signer init for builds without env keys
- **0G Compute:** `@0gfoundation/0g-compute-ts-sdk` ^0.8.4 — shared `lib/0gCompute.ts` inference helper
- **Contracts:** OpenZeppelin 5.6.1, Hardhat `evmVersion: cancun`
- **Next.js:** 15.5.18 (security patch)
- **Env template:** `.env.example` with testnet + mainnet addresses

### APIs

| Endpoint | Purpose |
|----------|---------|
| `POST /api/uploadFile` | Upload to 0G Storage, return Merkle root |
| `POST /api/computeInsights` | 0G Compute categorization + summary → vault `updateInsights` |
| `POST /api/agentRecommendations` | Domain agents (finance, travel, subscription) via 0G Compute |
| `POST /api/ledger` | Create ledger, deposit, fund provider sub-accounts |
| `GET /api/models` | List available 0G Compute inference services |

### Compute ledger requirements (verified)

Per [0G Compute docs](https://docs.0g.ai/developer-hub/building-on-0g/compute-network/inference):

- **Ledger creation:** minimum **3 OG** (`broker.ledger.addLedger(3)`)
- **Provider funding:** minimum **1 OG** per provider sub-account

Enforced in `lib/computeConstants.ts`, `/api/ledger`, and the Insights setup UI.

### Dashboard journey UX

Five-step flow in `lib/journey.ts`:

1. **Upload** — `/dashboard/vault/my-files`
2. **Insights** — `/dashboard/vault/insights`
3. **Chat** — `/dashboard/vault/chat` (coming soon)
4. **Agentic ID** — mint, learning, recommendations
5. **Ecosystem** — marketplace preview (coming soon)

Components: `Sidebar`, `JourneyStepHeader`, journey overview hub at `/dashboard`.

### Upload experience

- Drive-style drop zone with staged file queue
- Accurate upload toasts (storage → wallet tx → success / cancel / error)
- **0G pipeline** callouts: device → 0G Storage → on-chain vault
- Session upload table with copyable hashes and Chainscan tx links
- Vault file list: expandable cards, lazy preview from indexer, search + refresh
- **Testnet-first:** default chain Galileo (16602), `useTestnet: true` for vault txs

### Insights experience

- **Compute setup panel:** 4-step progress (ledger → fund → provider → compute)
- **Insights workspace:** multi-file selection, batch inference progress, category tabs
- Shared ledger state via `ComputeLedgerContext` + `useComputeLedger`
- Vault file deduplication by `rootHash` (on-chain duplicates handled)

### Agentic ID & domains

- `lib/domains.ts` — finance / travel / subscription matching
- `AgentLearning` + `AgentRecommendations` wired to real vault data
- Chain-aware agent addresses via `lib/addresses.ts`

---

## Network & contracts

### Development default: Galileo testnet

| Resource | Value |
|----------|--------|
| Chain ID | `16602` |
| RPC | `https://evmrpc-testnet.0g.ai` |
| Storage indexer | `https://indexer-storage-testnet-turbo.0g.ai` |
| Vault | `0x845Dc38fCe646C1F0FeB5b607B069D6A62537B81` |
| Agentic ID | `0x7fE958CaF70cdcEC187f30A216924878e2D89389` |

### Mainnet (production / prior deployment)

| Resource | Value |
|----------|--------|
| Chain ID | `16661` |
| Vault | `0x02AEA2c7E88E2e96CD4A02Ff3BA54f90520893c8` |
| Agentic ID | `0x721c164D1c7e67e522d50194C342006E36Fde05f` |
| [Storage proof](https://explorer.0g.ai/mainnet/storage/submissions/7322) | Submission #7322 |

Users can switch networks via RainbowKit ConnectButton. App defaults to testnet for buildathon development.

---

## Key files added / revamped

```
lib/journey.ts              # Journey step definitions
lib/explorer.ts             # Chainscan + StorageScan URLs
lib/computeConstants.ts     # 3 OG / 1 OG minimums
hooks/useComputeLedger.ts   # Ledger + model funding hook
components/vault/
  UploadArea.tsx            # Upload UX revamp
  FileList.tsx              # Vault file browser
  ComputeSetupPanel.tsx     # 0G Compute setup
  InsightsWorkspace.tsx     # Batch insights runner
components/dashboard/
  JourneyStepHeader.tsx     # Step navigation
```

---

## Local setup (quick)

```bash
npm install --legacy-peer-deps
cp .env.example .env
# Fill GALILEO_PRIVATE_KEY (server wallet with ≥3 OG for compute ledger)
npm run dev
```

Open `http://localhost:3000/dashboard` and connect wallet on **0G Galileo Testnet**.

---

## Wave 2+ (planned)

- Vault chat over 0G Compute (Step 3)
- ERC-7857 Agentic ID alignment
- Mainnet migration path (config + fresh on-chain activity)
- Agent marketplace / delegation (Step 5)
- Demo video refresh for new journey UX

---

## Links

- [Live demo](http://concierge-sigma.vercel.app/)
- [Demo video](https://youtu.be/PY_HBcew6oM)
- [X thread](https://x.com/mananbuilds/status/1985758895386800449)
- [0G Docs](https://docs.0g.ai/)
- [Agentic ID](https://docs.0g.ai/concepts/agentic-id)
- [StorageScan (Galileo)](https://storagescan-galileo.0g.ai/)
- [Chainscan (Galileo)](https://chainscan-galileo.0g.ai/)
