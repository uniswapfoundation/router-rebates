import { createPublicClient, http, type PublicClient } from "viem";
import {
  anvil,
  arbitrum,
  arbitrumSepolia,
  base,
  baseSepolia,
  mainnet,
  sepolia,
} from "viem/chains";

export function getClient(chainId: number): PublicClient {
  const envMode = process.env.NODE_ENV;
  if (chainId === 1) {
    return createPublicClient({
      chain:
        envMode === "mainnet" ? mainnet : envMode === "local" ? anvil : sepolia,
      transport: http(
        envMode === "mainnet"
          ? process.env.ETHEREUM_RPC_URL
          : envMode === "local"
          ? process.env.ETHEREUM_LOCAL_RPC_URL
          : process.env.ETHEREUM_SEPOLIA_RPC_URL
      ),
    });
  } else if (chainId == 8453) {
    // Base
    return createPublicClient({
      chain:
        envMode === "mainnet"
          ? base
          : envMode === "local"
          ? anvil
          : baseSepolia,
      transport: http(
        envMode === "mainnet"
          ? process.env.BASE_RPC_URL
          : envMode === "local"
          ? process.env.BASE_LOCAL_RPC_URL
          : process.env.BASE_SEPOLIA_RPC_URL
      ),
    });
  } else if (chainId == 42161) {
    // Arbitrum
    return createPublicClient({
      chain:
        envMode === "mainnet"
          ? arbitrum
          : envMode === "local"
          ? anvil
          : arbitrumSepolia,
      transport: http(
        envMode === "mainnet"
          ? process.env.ARBITRUM_RPC_URL
          : envMode === "local"
          ? process.env.ARBITRUM_LOCAL_RPC_URL
          : process.env.ARBITRUM_SEPOLIA_RPC_URL
      ),
    });
  } else if (chainId == 130) {
    // unichain, TODO by upgrading viem
    return createPublicClient({
      chain:
        envMode === "mainnet"
          ? arbitrum
          : envMode === "local"
          ? anvil
          : arbitrumSepolia,
      transport: http(
        envMode === "mainnet"
          ? process.env.UNICHAIN_RPC_URL
          : envMode === "local"
          ? process.env.UNICHAIN_LOCAL_RPC_URL
          : process.env.UNICHAIN_SEPOLIA_RPC_URL
      ),
    });
  } else {
    throw new Error(`Unsupported chainId: ${chainId}`);
  }
}
