/**
 * Concierge product spine — one narrative for UI copy.
 *
 * Concierge = vault-backed personal AI identity on 0G:
 * Storage holds bytes → Vault indexes them → Compute makes knowledge usable →
 * one Agentic ID you can chat with, rent, or sell.
 */

export const PRODUCT = {
  name: "Concierge",
  oneLiner:
    "Your on-chain personal AI identity: vault on 0G Storage, inference on 0G Compute, one Agentic ID you can use, rent, or sell.",
  pitchShort:
    "Store knowledge on 0G, fund compute so Concierge can read it, mint one Agentic ID, then chat — or list it on the ecosystem.",
  notThis:
    "Not three specialist bots. Not a trained model on upload. Prompt + vault evidence + compute, wrapped as a portable identity.",

  pillars: {
    storage: "0G Storage holds your files and evidence packs.",
    vault: "Your Vault contract is the on-chain catalog of what you own — chat always reads it live.",
    compute: "0G Compute powers knowledge feeds, chat, and tips — Concierge covers early testers.",
    agenticId:
      "One Agentic ID per wallet — portable personality and ownership. Knowledge stays in the vault; the NFT does not freeze learning at mint.",
  },

  sealNote:
    "On-chain vault fingerprint is an optional attestation of file roots. Update before listing if you want the chain to match your current vault — uploads and knowledge feeds apply to Chat either way.",

  layers: {
    stored: "Stored files — saved on 0G, like Drive.",
    knowledge: "Agent knowledge — structured or summarized so Concierge can use it.",
    askable: "What chat loads for data questions — knowledge packs that fetch from storage.",
  },

  loop: [
    "Add files to your vault",
    "Turn them into agent knowledge (feed files or Auto-read)",
    "Fund compute",
    "Chat or ask your data in chat",
    "Mint one Agentic ID when you want on-chain personality ownership",
    "Refresh vault fingerprint when listing (optional honesty)",
    "List, rent, or transfer on the ecosystem",
  ] as const,

  lensesNote:
    "Finance, travel, and subscriptions are focus chips in chat — not separate agent types or Agentic ID specialties.",
} as const;
