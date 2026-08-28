/** Shared client/server message format for board session signatures. */
export function boardAuthMessage(input: {
  wallet: string;
  timestamp: number;
  question: string;
}): string {
  // Sign the full normalized question so the prompt cannot be swapped after char 120.
  // Length is enforced separately (MAX_QUESTION_CHARS) before verify/compute.
  return [
    "Concierge Board Session",
    `Wallet: ${input.wallet.toLowerCase()}`,
    `Timestamp: ${input.timestamp}`,
    `Question: ${input.question.trim()}`,
  ].join("\n");
}
