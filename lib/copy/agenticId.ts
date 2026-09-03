/**
 * User-facing copy for the Agentic ID journey step.
 */

export const AGENTIC_ID_COPY = {
  pageTitleMint: "Mint your Agentic ID",
  pageTitleManage: "Your Agentic ID",
  taglineMint:
    "One on-chain identity per wallet — name your Concierge, bind it to your vault, and keep adding knowledge after mint.",
  taglineManage:
    "Your portable Concierge identity on 0G. Chat always reads your live vault — minting does not freeze what you know.",

  stats: {
    vaultFiles: "Vault files",
    vaultFilesHint: "Included in your vault fingerprint at mint",
    status: "Status",
    statusOwned: "Owned on this wallet",
    statusRental: "Rental access",
    statusMint: "Not minted yet",
    statusOnePerWallet: "One Agentic ID per wallet",
    network: "Network",
  },

  mint: {
    title: "Create your Agentic ID",
    subtitle:
      "Confirm in wallet · Your vault keeps growing after mint · Name & bio are optional",
    emptyVaultTitle: "No vault files yet",
    emptyVaultBody:
      "You can mint now with a wallet-only fingerprint, or upload files first so your identity reflects real evidence.",
    emptyVaultCta: "Upload files",
    nameSectionTitle: "Name your Concierge (optional)",
    nameSectionBody:
      "Shows on marketplace listings and rentals. You can change this anytime after mint.",
    displayNameLabel: "Display name",
    displayNamePlaceholder: "e.g. Manan's Concierge",
    displayNameHint: "Published to 0G Storage when you mint or save.",
    bioLabel: "Short description",
    bioPlaceholder: "What this Concierge helps with",
    domainNote: "On-chain domain stays concierge.agent",
    mintButton: "Mint Agentic ID",
    minting: "Minting…",
    advancedToggle: "Developer fields",
  },

  readiness: {
    vault: "Vault connected",
    fingerprint: "Vault fingerprint",
    fingerprintFiles: (n: number) =>
      `${n} file${n === 1 ? "" : "s"} in fingerprint`,
    fingerprintEmpty: "Wallet-only fingerprint (no files yet)",
    personality: "Name & bio",
    personalityOptional: "Optional — add before or after mint",
  },

  manage: {
    rentalBannerTitle: "Rental access",
    rentalBannerBody:
      "You can chat and use desk features tied to this token. Only the owner can edit the public profile or refresh the vault seal.",
    sealTitle: "Vault fingerprint on-chain",
    sealCurrent: "Matches your vault today",
    sealStale: "Vault changed since last update",
    sealUnknown: "Checking fingerprint…",
    sealBoardTrade:
      "Trading desk or board session is using on-chain metadata — seal update paused until that clears.",
    sealHint:
      "Optional attestation for marketplace honesty. Chat uses your live vault either way.",
    sealRefresh: "Update on-chain",
    sealReseal: "Update again",
    sealUpToDate: "Already up to date",
    profileTitle: "Public profile",
    profileBody:
      "Name and bio buyers and renters see on the ecosystem — not just a token number.",
    profileEmptyBio: "Add a name and short description for marketplace listings.",
    profileEdit: "Edit profile",
    profilePublish: "Save & publish",
    profileSaving: "Saving…",
    knowledgeFiles: "In knowledge base",
    nextStepsTitle: "What's next",
    nextStepsSubtitle: "Your identity is live — put it to work",
  },

  nextSteps: {
    chat: {
      title: "Chat",
      detail: "Ask questions grounded in your vault",
    },
    knowledge: {
      title: "Knowledge base",
      detail: "Feed files or review agent knowledge",
    },
    ecosystem: {
      title: "Ecosystem",
      detail: "List, rent, or transfer access",
    },
    desk: {
      title: "Trading desk",
      detail: "Agent suggestions you confirm",
    },
  },

  guide: [
    {
      id: "what",
      title: "What is an Agentic ID?",
      body: "On-chain ownership of your Concierge — vault-bound, rentable, transferable. Not a trained model and not a snapshot of your files at mint.",
    },
    {
      id: "mint",
      title: "Mint once",
      body: "Creates your identity on 0G Chain, linked to your vault contract. One per wallet. New uploads and fed files keep improving Chat after mint.",
    },
    {
      id: "seal",
      title: "Vault fingerprint",
      body: "Optional on-chain attestation of vault file roots. Update before listing if you want the chain to match today's vault. Chat never waits on this.",
    },
    {
      id: "vault",
      title: "Live vault",
      body: "The token stores your vault address. Chat and desk always read the live registry — knowledge base updates apply without reminting.",
    },
    {
      id: "profile",
      title: "Public profile",
      body: "Name and bio publish to 0G Storage so marketplace and rental cards show your personality.",
    },
    {
      id: "ecosystem",
      title: "Ecosystem",
      body: "List for sale, rent timed access, or transfer to another wallet. Vault binding travels with the token.",
    },
    {
      id: "standard",
      title: "0G standard",
      body: "Aligned with 0G's Agentic ID direction: own your Concierge identity on-chain, not just a pointer.",
    },
  ] as const,
} as const;
