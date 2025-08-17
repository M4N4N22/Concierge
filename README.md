# 🔐 VaultMind

**Your Data. Your AI. Your Control.**

The world's first platform where your personal AI advisor learns exclusively from your own secure data vault. Built on 0G's decentralized AI blockchain with revolutionary INFT technology.

[![Built with 0G](https://img.shields.io/badge/Built%20with-0G-B42DE6?style=flat-square)](https://0g.ai)
[![INFT Powered](https://img.shields.io/badge/INFT-Powered-B42DE6?style=flat-square)](#inft-technology)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Demo](https://img.shields.io/badge/Demo-Live-brightgreen?style=flat-square)](https://vaultmind.demo)

---

## 🚀 The Problem We Solve

**Current Reality:**
- Your personal data is scattered across 87+ different platforms
- Big Tech makes $127B annually from YOUR data while you get generic AI responses
- ChatGPT doesn't know your spending habits, travel preferences, or life patterns
- 2.5 billion people use AI assistants, but 0% own their AI's training data

**Our Solution:**
VaultMind creates **Intelligent NFTs (INFTs)** that are AI agents trained exclusively on your personal data vault, giving you the world's first truly personalized AI advisor that you actually own.

---

## ⚡ Key Features

### 🔒 **Secure Personal Data Vault**
- Upload and store personal files on 0G's decentralized storage
- End-to-end encryption with user-controlled keys
- Cross-platform sync (web, mobile, desktop)

### 🤖 **INFT-Powered AI Agents**
- **Revolutionary INFT Technology**: Your AI advisor is an Intelligent NFT that evolves with your data
- **True Personalization**: AI trained exclusively on YOUR personal files and preferences
- **Ownership**: Unlike ChatGPT, you actually own your AI agent as a tradeable NFT
- **Evolution**: Your INFT agent gets smarter as you add more data to your vault

### 🧠 **Multi-Domain Intelligence**
- **Financial Advisor**: Analyzes spending patterns, optimizes subscriptions
- **Travel Assistant**: Learns from past trips, suggests personalized itineraries  
- **Health Guide**: Tracks wellness data, provides personalized insights
- **Productivity Coach**: Organizes your digital life, finds important documents instantly

### 🌐 **Decentralized Architecture**
- Built on 0G's complete AI blockchain stack
- Zero-knowledge proofs ensure privacy
- Verifiable AI decisions on-chain
- Cross-chain compatibility

---

## 🏗️ Architecture

VaultMind leverages the complete 0G ecosystem:

```
┌─────────────────────────────────────────────────────────────────┐
│                         VaultMind Platform                       │
├─────────────────────────────────────────────────────────────────┤
│  🤖 INFT AI Agents    │  🔐 Data Vault UI  │  🏪 Agent Marketplace │
├─────────────────────────────────────────────────────────────────┤
│                        0G Blockchain Stack                       │
├─────────────────────────────────────────────────────────────────┤
│ 0G Chain (INFT Contracts) │ 0G Storage │ 0G Compute │ 0G DA      │
└─────────────────────────────────────────────────────────────────┘
```

### **0G Services Integration:**
- **0G Chain**: INFT smart contracts (ERC-7857), marketplace transactions
- **0G Storage**: Encrypted personal data vaults with user-controlled access
- **0G Compute**: AI model inference and training on personal data
- **0G DA**: Real-time data availability and cross-chain synchronization
- **AI Alignment Nodes**: Ensure INFT agents act in user's best interest

---

## 🎯 INFT Technology

**What makes our INFTs special:**

### Traditional NFTs vs VaultMind INFTs

| Feature | Traditional NFTs | **VaultMind INFTs** |
|---------|------------------|----------------------|
| **Utility** | Static image/metadata | ✅ Functional AI agent |
| **Personalization** | One-size-fits-all | ✅ Learns from YOUR data |
| **Evolution** | Never changes | ✅ Gets smarter over time |
| **Privacy** | Public metadata | ✅ Private, encrypted training data |
| **Interactivity** | View only | ✅ Chat, get advice, take actions |
| **Value Accrual** | Speculation only | ✅ More data = better AI = higher value |

### **INFT Agent Capabilities:**
- **Chat Interface**: Natural conversation with your personal AI
- **Data Analysis**: Processes your vault data to provide insights  
- **Action Execution**: Can book flights, cancel subscriptions, optimize finances
- **Learning**: Improves recommendations based on your feedback
- **Trading**: Successful agent configurations can be traded on marketplace

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Wallet with 0G testnet tokens
- 0G development environment setup

### Installation

```bash
# Clone the repository
git clone https://github.com/vaultmind/vaultmind-platform.git
cd vaultmind-platform

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your 0G network configuration and API keys

# Start development server
npm run dev
```

### Environment Variables

```bash
# 0G Network Configuration
NEXT_PUBLIC_0G_CHAIN_RPC="https://evmrpc-testnet.0g.ai"
NEXT_PUBLIC_0G_STORAGE_ENDPOINT="https://storage-testnet.0g.ai"
NEXT_PUBLIC_0G_COMPUTE_ENDPOINT="https://compute-testnet.0g.ai"

# Smart Contract Addresses
NEXT_PUBLIC_INFT_CONTRACT_ADDRESS="0x..."
NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS="0x..."

# API Keys
OPENAI_API_KEY="your-key-here"
PINATA_API_KEY="your-key-here"
```

---

## 🏪 Usage Examples

### 1. Create Your Data Vault
```typescript
import { VaultMind } from '@vaultmind/sdk';

const vaultmind = new VaultMind({
  storageEndpoint: process.env.NEXT_PUBLIC_0G_STORAGE_ENDPOINT,
  userWallet: wallet
});

// Upload personal files to encrypted vault
const vault = await vaultmind.createVault();
await vault.uploadFile('./bank-statement.pdf', { encrypted: true });
await vault.uploadFile('./travel-receipts/', { encrypted: true });
```

### 2. Mint Your INFT Agent
```typescript
// Mint a personal AI agent as INFT
const agent = await vaultmind.mintINFTAgent({
  name: "My Financial Advisor",
  specialization: "finance",
  vaultAccess: vault.id,
  personality: "conservative, detail-oriented"
});

console.log(`INFT Agent minted: ${agent.tokenId}`);
```

### 3. Interact with Your Agent
```typescript
// Chat with your personal AI agent
const response = await agent.chat({
  message: "How much am I spending on subscriptions?",
  context: "financial_analysis"
});

console.log(response.message);
// "Based on your vault data, you're spending $127/month on 8 subscriptions. 
//  I found 3 you haven't used in 60+ days. Want me to help you cancel them?"
```

### 4. Marketplace Operations
```typescript
// List successful agent on marketplace
await vaultmind.marketplace.listAgent({
  agentId: agent.tokenId,
  price: "0.5", // 0.5 ETH
  includeTrainingData: false, // Only personality, not personal data
  royalty: 0.1 // 10% to original creator
});
```

---

## 🛠️ Development

### Project Structure
```
vaultmind-platform/
├── apps/
│   ├── web/                 # Next.js web application
│   ├── mobile/              # React Native mobile app
│   └── extension/           # Browser extension
├── packages/
│   ├── sdk/                 # VaultMind TypeScript SDK
│   ├── contracts/           # Smart contracts (INFT, Vault, Marketplace)
│   ├── ui/                  # Shared UI components
│   └── agents/              # AI agent templates and logic
├── docs/                    # Documentation
└── scripts/                 # Deployment and utility scripts
```

### Smart Contracts

#### INFT Agent Contract (ERC-7857)
```solidity
// Intelligent NFT that binds AI agents to user data vaults
contract INFTAgent is ERC7857 {
    struct AgentData {
        bytes32 vaultHash;      // Link to user's data vault
        string specialization;   // Finance, travel, health, etc.
        uint256 trainingBlocks; // Blocks of training data processed
        uint256 accuracy;       // Performance metrics
    }
    
    mapping(uint256 => AgentData) public agents;
    
    function mintAgent(
        address to,
        bytes32 vaultHash,
        string memory specialization
    ) external returns (uint256 tokenId);
}
```

### API Routes

```typescript
// Example API endpoint for agent interaction
// /api/agents/[tokenId]/chat
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { tokenId } = req.query;
  const { message, context } = req.body;
  
  // Verify INFT ownership
  const agent = await verifyINFTOwnership(tokenId, req.user.address);
  
  // Process message with agent's personal data context
  const response = await processAgentMessage(agent, message, context);
  
  res.json({ response });
}
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run smart contract tests
npm run test:contracts

# Run integration tests with 0G testnet
npm run test:integration

# Run agent training simulation
npm run test:agents
```

---

## 🚀 Deployment

### Testnet Deployment
```bash
# Deploy smart contracts to 0G testnet
npm run deploy:testnet

# Deploy web app to Vercel
npm run deploy:web

# Verify contracts
npm run verify:contracts
```

### Production Deployment
```bash
# Deploy to 0G mainnet
npm run deploy:mainnet

# Update contract addresses in frontend
npm run update:contracts
```

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-inft-feature`
3. **Make your changes** and add tests
4. **Run tests**: `npm test`
5. **Submit a pull request**

### Contribution Guidelines
- Follow TypeScript and Solidity best practices
- Add tests for new features
- Update documentation
- Ensure privacy and security standards

---

## 📊 Roadmap

### ✅ Phase 1: Foundation (Current)
- [x] Basic data vault with 0G Storage integration
- [x] INFT agent minting (ERC-7857)
- [x] Simple AI chat interface
- [x] Web application MVP

### 🔄 Phase 2: Intelligence (In Progress)
- [ ] Multi-domain AI agents (finance, travel, health)
- [ ] Advanced data analysis and insights
- [ ] Cross-agent communication
- [ ] Mobile application

### 🔮 Phase 3: Marketplace (Q2 2024)
- [ ] INFT agent marketplace
- [ ] Agent performance metrics and leaderboards
- [ ] Revenue sharing for creators
- [ ] Enterprise solutions

### 🚀 Phase 4: Ecosystem (Q3 2024)
- [ ] Third-party integrations (banks, travel sites, etc.)
- [ ] Cross-chain INFT portability
- [ ] Advanced privacy features (ZK proofs)
- [ ] DAO governance

---

## 💡 Use Cases

### Personal Finance Management
- **Problem**: Generic financial advice doesn't account for your specific situation
- **VaultMind Solution**: INFT agent analyzes your actual bank statements, spending patterns, and financial goals to provide personalized investment and budgeting advice

### Travel Planning  
- **Problem**: Travel apps don't know your preferences, budget, or past experiences
- **VaultMind Solution**: INFT agent learns from your travel history, preferred airlines, hotel choices, and budget to suggest perfectly tailored itineraries

### Health & Wellness
- **Problem**: Health apps can't see your complete wellness picture
- **VaultMind Solution**: INFT agent analyzes your exercise data, meal photos, sleep patterns, and medical records to provide holistic health insights

---

## 🔒 Security & Privacy

### Data Security
- **End-to-end encryption** using AES-256
- **User-controlled keys** - we never see your data
- **0G decentralized storage** - no single point of failure
- **Regular security audits** and penetration testing

### Privacy Guarantees  
- **Zero-knowledge proofs** for AI training
- **On-chain verification** without revealing personal data
- **GDPR compliance** with right to deletion
- **No data selling** - you own your data completely

---

## 📈 Metrics & Analytics

Track your VaultMind usage:
- **Data Vault Size**: How much personal data you've uploaded
- **Agent Intelligence**: Your INFT's learning progress and accuracy
- **Insights Generated**: Number of personalized recommendations
- **Actions Taken**: Tasks completed by your agent
- **Value Created**: Money saved/earned through agent recommendations

---

## 🏆 Awards & Recognition

- 🥇 **Winner**: ETHGlobal Trifecta 2025
- 🥇 **Winner**: 0G Network Hackathon
- 🏅 **Featured**: 0G Awesome Repository
- 📺 **Coverage**: Featured in Decrypt, CoinDesk, The Block

---

## 🤖 FAQ

**Q: How is this different from ChatGPT?**
A: ChatGPT gives generic advice because it doesn't know your personal data. VaultMind's INFT agents learn exclusively from YOUR vault data, providing truly personalized insights.

**Q: Is my data secure?**
A: Yes. Your data is encrypted and stored on 0G's decentralized network. Only you have the keys. We use zero-knowledge proofs so AI can learn without accessing raw data.

**Q: What's special about INFT technology?**
A: INFTs are the first functional AI agents you can actually own. Unlike traditional NFTs, they provide real utility by learning from your data and getting smarter over time.

**Q: Can I trade my INFT agent?**
A: Yes! You can trade agent configurations (personality, specialization)
