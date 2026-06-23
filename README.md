# Concierge

A decentralized platform that transforms personal data into intelligent, evolving **Agentic IDs** (onchain AI agents). Built on 0G Storage, Compute, and Chain. Participating in the **0G Bridge Buildathon** by AKINDO.

> **Wave 1 changelog:** [WAVE1_UPDATES.md](./WAVE1_UPDATES.md)  
> **Buildathon summary:** [OG_BRIDGE.md](./OG_BRIDGE.md)

## Quick Links

- [How it Works (Twitter/X Thread)](https://x.com/mananbuilds/status/1985758895386800449)
- [Demo Video](https://youtu.be/PY_HBcew6oM)
- [Try Concierge](http://concierge-sigma.vercel.app/)
- [0G Documentation](https://docs.0g.ai)
- [Agentic ID (ERC-7857)](https://docs.0g.ai/concepts/agentic-id)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         User Interface                       │
│  (Next.js Dashboard — Journey: Upload → Insights → Agentic ID) │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌──────────────┐ ┌─────────────┐ ┌──────────────┐
│   Vault.sol  │ │INFTAgent.sol│ │  0G Storage  │
│  (Registry)  │ │ (Agentic ID)│ │ Testnet/Main │
└──────┬───────┘ └──────┬──────┘ └──────┬───────┘
       │                │               │
       └────────────────┼───────────────┘
                        │
                        ▼
              ┌──────────────────┐
              │   0G Compute     │
              │ (Cluster/Summ.)  │
              └──────────────────┘
```

**Data Flow:**
1. User uploads documents via dashboard (encrypted on **0G Storage**, registered in **Vault.sol**)
2. User sets up **0G Compute** ledger (3 OG min), funds a provider, runs inference
3. Insights (category + summary) stored on 0G and written back to the vault on-chain
4. User mints a personal **Agentic ID** trained on vault data
5. Domain agents (finance, travel, subscription) provide recommendations via 0G Compute

## What Problem This Solves

People have scattered personal data across emails, downloads, PDFs, and message attachments. This application:

- **Ingests** diverse document types from users
- **Clusters** similar documents (health records, travel receipts, subscriptions)
- **Summarizes** patterns and generates insights
- **Visualizes** meaningful views: medical timelines, spending patterns, subscription burn rates
- **Creates** an intelligent, evolving **Agentic ID** that learns from user data

## Key Differentiator

Users mint a personalized **Agentic ID** (ERC-7857 path) — an evolving AI agent trained on their own data. This agent:

- Learns continuously as new documents are uploaded
- Provides contextual recommendations based on real user patterns
- Can be delegated, shared, or rented
- Turns personal data into a monetizable digital asset

Result: Personal data chaos becomes structured personal intelligence.

## Deployment Status

### Development default: Galileo testnet

The app defaults to **0G Galileo Testnet** (chain `16602`) for wallet connections and vault transactions. Switch to mainnet via RainbowKit when ready.

| Contract | Testnet (Galileo) | Mainnet (Aristotle) |
|----------|-------------------|---------------------|
| **Vault** | `0x845Dc38fCe646C1F0FeB5b607B069D6A62537B81` | `0x02AEA2c7E88E2e96CD4A02Ff3BA54f90520893c8` |
| **Agentic ID** | `0x7fE958CaF70cdcEC187f30A216924878e2D89389` | `0x721c164D1c7e67e522d50194C342006E36Fde05f` |

### Infrastructure

- **0G Storage** — testnet indexer for dev; mainnet deployment proven (see below)
- **0G Compute** — Galileo testnet (`GALILEO_RPC_URL`, server-side broker wallet)
- **Compute ledger** — minimum **3 OG** to create; **1 OG** min per provider ([docs](https://docs.0g.ai/developer-hub/building-on-0g/compute-network/inference))

### Mainnet storage proof (prior upload)

- [Check on 0g Explorer](https://explorer.0g.ai/mainnet/storage/submissions/7322)

```
Medical Bill: $3,000 on 2025-09-30.

Local Merkle root (deterministic): 0xbfb478f01278128a81a782e78b8cea36dcfa4edfc8536a2ab08392a028adf31d
Starting upload to indexer...
First selected node status : {
  connectedPeers: 37,
  logSyncHeight: 11750834,
  logSyncBlock: '0x321b59839526c77c2b176d1b1b7c6467e4f3c13956dcfe5abf655326e3e7bc38',
  nextTxSeq: 7322,
  networkIdentity: {
    chainId: 16661,
    flowAddress: '0x62d4144db0f0a6fbbaeb6296c785c71b3d57c526',
    p2pProtocolVersion: { major: 0, minor: 4, build: 0 }
  }
}
Selected nodes: [
  StorageNode {
    url: 'http://218.94.159.101:30275',
    timeout: 30000,
    retry: 3
  }
]
Data prepared to upload root=0xbfb478f01278128a81a782e78b8cea36dcfa4edfc8536a2ab08392a028adf31d size=35 numSegments=1 numChunks=1        
Submitting transaction with storage fee: 30733644962n
Sending transaction with gas price 4000000007
Transaction hash: 0xaf20640b7d620580aa16b26387eecaad38ca91fce107c5d78867c77bdf3f1772
Transaction sequence number: 7322
Wait for log entry on storage node
Log entry is unavailable yet, zgsNodeSyncHeight=11750843
Log entry is unavailable yet, zgsNodeSyncHeight=11750850
Log entry is unavailable yet, zgsNodeSyncHeight=11750850
Log entry is unavailable yet, zgsNodeSyncHeight=11750851
Tasks created: [
  [
    {
      clientIndex: 0,
      taskSize: 10,
      segIndex: 0,
      numShard: 1,
      txSeq: 7322
    }
  ]
]
Processing tasks in parallel with  1  tasks...
All tasks processed
Wait for log entry on storage node
Upload successful. Indexer response: 0xaf20640b7d620580aa16b26387eecaad38ca91fce107c5d78867c77bdf3f1772
Final rootHash used: 0xbfb478f01278128a81a782e78b8cea36dcfa4edfc8536a2ab08392a028adf31d
```

### Infrastructure (summary)

- Local dev: connect wallet on Galileo → upload → fund compute ledger → run insights → mint Agentic ID
- Mainnet contracts deployed; testnet used for active buildathon development

## Project Structure

```
app/
├── (main)/dashboard/
│   ├── page.tsx            # Journey overview hub
│   ├── agent/              # Agentic ID
│   │   ├── learning/
│   │   ├── mint/
│   │   └── recommendations/
│   └── vault/
│       ├── my-files/       # Upload
│       ├── insights/       # 0G Compute setup + AI insights
│       └── chat/           # Coming soon
├── api/
│   ├── uploadFile/
│   ├── computeInsights/
│   ├── agentRecommendations/
│   ├── ledger/             # POST — create, deposit, fund provider
│   └── models/

components/
├── dashboard/JourneyStepHeader.tsx
├── vault/
│   ├── UploadArea.tsx
│   ├── FileList.tsx
│   ├── ComputeSetupPanel.tsx
│   └── InsightsWorkspace.tsx
└── Sidebar.tsx

lib/
├── journey.ts              # 5-step user journey
├── addresses.ts            # Chain-aware contract addresses
├── computeConstants.ts     # Ledger minimums (3 OG / 1 OG)
└── explorer.ts             # Chainscan + StorageScan helpers

hooks/
├── useAddToVault.ts
├── useComputeLedger.ts
├── useFileContent.ts
├── useINFTAgent.ts
└── useUserFiles.ts
```

## Setup Instructions

### Prerequisites

- Node.js v18+ and npm
- MetaMask or compatible Web3 wallet
- 0G testnet/mainnet tokens for gas

### Installation

1. Clone the repository:
```bash
git clone https://github.com/M4N4N22/Concierge.git
cd Concierge
```

2. Install dependencies:
```bash
npm install --legacy-peer-deps
```

3. Copy environment template and fill secrets:
```bash
cp .env.example .env
```

4. Run development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

### Smart Contract Deployment

For testnet deployment:
```bash
npm run deploy:testnet
```

For mainnet deployment:
```bash
npm run deploy:mainnet
```

## Environment Configuration

Copy `.env.example` to `.env`. Key variables:

| Variable | Purpose |
|----------|---------|
| `OG_CHAIN_ID` | Server-side storage default chain (`16602` testnet) |
| `GALILEO_PRIVATE_KEY` | Server wallet for storage upload + compute broker (needs ≥3 OG for ledger) |
| `GALILEO_RPC_URL` | Galileo testnet RPC |
| `INDEXER_RPC_URL` | 0G Storage testnet indexer |
| `VAULT_ADDRESS` / `NEXT_PUBLIC_VAULT_ADDRESS` | Vault contract (per network) |
| `NEXT_PUBLIC_INFTAGENT_*` | Agentic ID contract addresses |

See `.env.example` for the full list. Never commit `.env` with real private keys.

## Usage Workflow

1. **Connect wallet** — RainbowKit on **0G Galileo Testnet** (default)
2. **Upload** — Add files to vault (0G Storage + on-chain registry)
3. **Set up compute** — Create ledger (3 OG), fund provider (1 OG min)
4. **Run insights** — 0G Compute categorizes and summarizes vault files
5. **Mint Agentic ID** — Personal on-chain agent bound to your vault
6. **Domain learning & recommendations** — Finance, travel, subscription agents

See [WAVE1_UPDATES.md](./WAVE1_UPDATES.md) for the full Wave 1 feature list.

## Tech Stack

- **Frontend:** Next.js 15.5, React 19, TypeScript, TailwindCSS, RainbowKit
- **Smart Contracts:** Solidity 0.8.28, Hardhat, OpenZeppelin 5.6
- **0G Storage:** `@0gfoundation/0g-storage-ts-sdk` ^1.2
- **0G Compute:** `@0gfoundation/0g-compute-ts-sdk` ^0.8
- **Web3:** wagmi, viem, ethers.js

## API Endpoints

- `POST /api/uploadFile` — Upload file to 0G Storage
- `POST /api/computeInsights` — Categorize and summarize via 0G Compute; update vault
- `POST /api/agentRecommendations` — Domain-specific agent recommendations
- `POST /api/ledger` — Ledger create / deposit / fund provider (`action` in body)
- `GET /api/models` — List available 0G Compute inference services

## Smart Contracts

### Vault.sol
Data registry contract managing ownership and metadata for uploaded documents.

### INFTAgent.sol (Agentic ID)
ERC721 upgradeable contract for personal AI agents, bound to user vault. ERC-7857 migration on roadmap.

## Security Considerations

- All user data encrypted before 0G Storage upload
- Private keys never leave user's browser
- Smart contracts audited for common vulnerabilities
- Read-only operations do not require wallet signatures

## Future Roadmap

- Vault chat (Step 3) over 0G Compute
- Migrate compute + storage defaults to mainnet for production
- ERC-7857 Agentic ID alignment
- Agent marketplace and delegation (Step 5)
- Privacy-preserving federated learning

## Contributing

Contributions are welcome. Please open an issue before submitting major changes.

## License

MIT License - see LICENSE file for details

## Support

For questions or issues, open a GitHub issue or reach out via the community channels.

---

Built with 0G infrastructure. [Wave 1 updates](./WAVE1_UPDATES.md) · [0G Bridge Buildathon](https://app.akindo.io/wave-hacks/Z4MlX4vreI72ol6pd) (AKINDO).
