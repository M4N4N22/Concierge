export interface VaultFile {
    rootHash: string;
    category: string;
    insightsCID: string;
    timestamp: number;
    txHash: string;
    file: File;
    content?: string; // optional for text preview
  }
  