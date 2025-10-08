//lib/INFTAgentAbi.ts
import INFTAgentArtifact from "@/artifacts/contracts/Agent/INFTAgent.sol/INFTAgent.json";
export const INFT_AGENT_ABI = INFTAgentArtifact.abi;

export const INFT_AGENT_ADDRESS =
  process.env.NEXT_PUBLIC_INFTAGENT_ADDRESS as `0x${string}`;