# Concierge

A decentralized platform that transforms personal data into intelligent, evolving AI agents. Built on 0G Network infrastructure with mainnet deployment.

## Quick Link

- [How it Works (Twitter/X Thread)](https://x.com/mananbuilds/status/1985758895386800449)
- [Demo Video](https://youtu.be/PY_HBcew6oM)
- [0G Network Documentation](https://docs.0g.ai)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         User Interface                       │
│  (Next.js Dashboard - Upload, Insights, Agent Management)   │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌──────────────┐ ┌─────────────┐ ┌──────────────┐
│   Vault.sol  │ │INFTAgent.sol│ │  0G Storage  │
│  (Registry)  │ │  (ERC721)   │ │   (Mainnet)  │
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
1. User uploads documents via dashboard
2. Files stored permanently on 0G Storage (mainnet)
3. Vault contract registers ownership and metadata
4. 0G Compute clusters similar documents and generates summaries
5. User mints personalized INFT agent trained on their data
6. INFT evolves with new uploads, provides recommendations

## What Problem This Solves

People have scattered personal data across emails, downloads, PDFs, and message attachments. This application:

- **Ingests** diverse document types from users
- **Clusters** similar documents (health records, travel receipts, subscriptions)
- **Summarizes** patterns and generates insights
- **Visualizes** meaningful views: medical timelines, spending patterns, subscription burn rates
- **Creates** an intelligent, evolving agent (INFT) that learns from user data

Result: Personal data chaos becomes structured personal intelligence.

## Key Differentiator

Users mint a personalized **Intelligent NFT (INFT)** - an evolving AI agent trained on their own data. This agent:

- Learns continuously as new documents are uploaded
- Provides contextual recommendations based on real user patterns
- Can be delegated, shared, or rented
- Turns personal data into a monetizable digital asset

## Deployment Status

### Mainnet Contracts
- **Vault / Data Registry:** `0x02AEA2c7E88E2e96CD4A02Ff3BA54f90520893c8`
- **INFT Agent Contract:** `0x721c164D1c7e67e522d50194C342006E36Fde05f`

### Infrastructure
- User documents stored permanently on **0G Storage (Mainnet)**
- Compute layer runs on **0G Compute Testnet** (modular - mainnet migration is a config swap)
- Full workflow live: connect wallet → upload → cluster → summarize → mint INFT → manage data

## Project Structure

```
app/
├── (main)/dashboard/
│   ├── agent/          # INFT agent interfaces
│   │   ├── learning/
│   │   ├── mint/
│   │   └── recommendations/
│   └── vault/          # Data management
│       ├── insights/
│       └── my-files/
├── api/
│   ├── computeInsights/    # Clustering & summarization
│   ├── ledger/             # Transaction records
│   ├── models/             # AI model management
│   └── uploadFile/         # 0G Storage upload

contracts/
├── Agent/
│   └── INFTAgent.sol       # ERC721 intelligent NFT
└── Vault/
    └── Vault.sol           # Data registry & ownership

hooks/
├── useAddToVault.ts        # Vault interactions
├── useComputeInsights.ts   # Trigger compute jobs
├── useFileContent.ts       # Fetch from 0G Storage
├── useINFTAgent.ts         # INFT minting & management
└── useUserFiles.ts         # File listing
```

## Setup Instructions

### Prerequisites

- Node.js v18+ and npm
- MetaMask or compatible Web3 wallet
- 0G testnet/mainnet tokens for gas

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd next-app
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables (see Environment Configuration below)

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

### Testnet Setup (.env.testnet)

Create `.env.testnet` in project root:

```env
NETWORK=galileo
OG_TESTNET_CHAIN_ID=16602

# Wallet Configuration
GALILEO_PRIVATE_KEY=your_private_key_here
DEPLOYER_ADDRESS=your_deploy_wallet_address

# Network RPCs
GALILEO_RPC_URL=https://evmrpc-testnet.0g.ai
INDEXER_RPC_URL=https://indexer-storage-testnet-turbo.0g.ai

# Deployed Contract Addresses
VAULT_ADDRESS=0x845Dc38fCe646C1F0FeB5b607B069D6A62537B81
INFTAGENT_ADDRESS=0x7fE958CaF70cdcEC187f30A216924878e2D89389

# Frontend Environment Variables (Browser-Exposed)
NEXT_PUBLIC_GALILEO_RPC_URL=https://evmrpc-testnet.0g.ai
NEXT_PUBLIC_VAULT_ADDRESS=0x845Dc38fCe646C1F0FeB5b607B069D6A62537B81
NEXT_PUBLIC_INFTAGENT_ADDRESS=0x7fE958CaF70cdcEC187f30A216924878e2D89389
NEXT_PUBLIC_INDEXER_GATEWAY=https://indexer-storage-testnet-turbo.0g.ai
```

### Mainnet Setup (.env.mainnet)

Create `.env.mainnet` in project root:

```env
NETWORK=mainnet
OG_CHAIN_ID=16661

# Wallet Configuration
OG_MAINNET_PRIVATE_KEY=your_private_key_here
DEPLOYER_ADDRESS=your_deploy_wallet_address

# 0G Mainnet Infrastructure
OG_MAINNET_RPC_URL=https://evmrpc.0g.ai
INDEXER_RPC_URL=https://indexer-storage-turbo.0g.ai

# Production Contract Addresses
VAULT_ADDRESS=0x02AEA2c7E88E2e96CD4A02Ff3BA54f90520893c8
INFTAGENT_ADDRESS=0x721c164D1c7e67e522d50194C342006E36Fde05f

# Frontend Environment Variables (Browser-Exposed)
NEXT_PUBLIC_OG_MAINNET_RPC_URL=https://evmrpc.0g.ai
NEXT_PUBLIC_VAULT_ADDRESS=0x02AEA2c7E88E2e96CD4A02Ff3BA54f90520893c8
NEXT_PUBLIC_INFTAGENT_ADDRESS=0x721c164D1c7e67e522d50194C342006E36Fde05f
NEXT_PUBLIC_INDEXER_GATEWAY=https://indexer-storage-turbo.0g.ai
```

### Environment Variable Notes

- Never commit `.env` files with real private keys
- Replace placeholder addresses after deploying contracts
- `NEXT_PUBLIC_*` variables are exposed to the browser
- Keep private keys secure and never share them

## Usage Workflow

1. **Connect Wallet**: Connect MetaMask to 0G Network
2. **Upload Documents**: Drag and drop files to vault
3. **View Insights**: Automatic clustering and summarization
4. **Mint INFT**: Create personalized intelligent agent
5. **Agent Learning**: INFT learns from your data patterns
6. **Get Recommendations**: Receive contextual insights

## Tech Stack

- **Frontend:** Next.js 14, React, TypeScript, TailwindCSS
- **Smart Contracts:** Solidity, Hardhat, OpenZeppelin
- **Storage:** 0G Storage (Mainnet)
- **Compute:** 0G Compute Layer
- **Web3:** wagmi, viem, ethers.js

## API Endpoints

- `POST /api/uploadFile` - Upload file to 0G Storage
- `POST /api/computeInsights` - Trigger clustering and summarization
- `GET /api/ledger` - Fetch transaction history
- `GET /api/models` - List available AI models

## Smart Contracts

### Vault.sol
Data registry contract managing ownership and metadata for uploaded documents.

### INFTAgent.sol
ERC721 contract for intelligent NFT agents. Each INFT is trained on user-specific data and evolves over time.

## Security Considerations

- All user data encrypted before 0G Storage upload
- Private keys never leave user's browser
- Smart contracts audited for common vulnerabilities
- Read-only operations do not require wallet signatures

## Future Roadmap

- Migrate compute layer to 0G Mainnet
- Multi-chain INFT portability
- Advanced recommendation algorithms
- INFT marketplace for data-backed agent trading
- Cross-agent collaboration protocols
- Privacy-preserving federated learning

## Contributing

Contributions are welcome. Please open an issue before submitting major changes.

## License

MIT License - see LICENSE file for details

## Support

For questions or issues, open a GitHub issue or reach out via the community channels.

---

Built with 0G Network infrastructure during WaveHack hackathon.
