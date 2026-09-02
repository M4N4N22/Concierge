/** Public GitHub links for feedback and support. */
export const GITHUB_REPO = "https://github.com/M4N4N22/Concierge";

export const GITHUB_ISSUES = `${GITHUB_REPO}/issues`;

export const GITHUB_REPORT_BUG = `${GITHUB_REPO}/issues/new?title=${encodeURIComponent("[Bug] ")}&labels=bug&body=${encodeURIComponent(
  "## What happened?\n\n\n## Steps to reproduce\n1. \n\n## Expected\n\n\n## Wallet / chain\n\n\n## Screenshots or logs\n"
)}`;

export const GITHUB_ASK_QUESTION = `${GITHUB_REPO}/issues/new?title=${encodeURIComponent("[Question] ")}&labels=question&body=${encodeURIComponent(
  "## Question\n\n\n## What you tried\n\n\n## Wallet / page\n"
)}`;

export const GITHUB_FEATURE_REQUEST = `${GITHUB_REPO}/issues/new?title=${encodeURIComponent("[Feature] ")}&labels=enhancement&body=${encodeURIComponent(
  "## Idea\n\n\n## Why it helps\n"
)}`;
