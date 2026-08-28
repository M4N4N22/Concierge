/** Shared client/server message format for board session signatures. */
export function boardAuthMessage(input: {
  wallet: string;
  timestamp: number;
  question: string;
}): string {
  return [
    "Concierge Board Session",
    `Wallet: ${input.wallet.toLowerCase()}`,
    `Timestamp: ${input.timestamp}`,
    `Question: ${input.question.trim().slice(0, 120)}`,
  ].join("\n");
}
