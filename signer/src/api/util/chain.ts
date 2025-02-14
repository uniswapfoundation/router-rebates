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
      chain: mainnet,
      transport: http(
        envMode === "dev"
          ? process.env.ETHEREUM_LOCAL_RPC_URL
          : process.env.ETHEREUM_RPC_URL
      ),
    });
  } else if (chainId === 8453) {
    // Base
    return createPublicClient({
      chain: base,
      transport: http(
        envMode === "dev"
          ? process.env.BASE_LOCAL_RPC_URL
          : process.env.BASE_RPC_URL
      ),
    });
  } else if (chainId === 42161) {
    // Arbitrum
    return createPublicClient({
      chain: arbitrum,
      transport: http(
        envMode === "dev"
          ? process.env.ARBITRUM_LOCAL_RPC_URL
          : process.env.ARBITRUM_RPC_URL
      ),
    });
  } else if (chainId === 130) {
    // Unichain, TODO by upgrading viem
    return createPublicClient({
      chain: arbitrum,
      transport: http(
        envMode === "dev"
          ? process.env.UNICHAIN_LOCAL_RPC_URL
          : process.env.UNICHAIN_RPC_URL
      ),
    });
  } else if (chainId === 11155111) {
    // Ethereum Sepolia
    return createPublicClient({
      chain: sepolia,
      transport: http(
        envMode === "dev"
          ? process.env.ETHEREUM_SEPOLIA_LOCAL_RPC_URL
          : process.env.ETHEREUM_SEPOLIA_RPC_URL
      ),
    });
  } else if (chainId === 84532) {
    // Base Sepolia
    return createPublicClient({
      chain: baseSepolia,
      transport: http(
        envMode === "dev"
          ? process.env.BASE_SEPOLIA_LOCAL_RPC_URL
          : process.env.BASE_SEPOLIA_RPC_URL
      ),
    });
  } else if (chainId === 421614) {
    // Arbitrum Sepolia
    return createPublicClient({
      chain: arbitrumSepolia,
      transport: http(
        envMode === "dev"
          ? process.env.ARBITRUM_SEPOLIA_LOCAL_RPC_URL
          : process.env.ARBITRUM_SEPOLIA_RPC_URL
      ),
    });
  } else if (chainId === 1301) {
    // Unichain Sepolia, TODO by upgrading viem
    return createPublicClient({
      chain: sepolia,
      transport: http(
        envMode === "dev"
          ? process.env.UNICHAIN_SEPOLIA_LOCAL_RPC_URL
          : process.env.UNICHAIN_SEPOLIA_RPC_URL
      ),
    });
  } else if (chainId === 31337) {
    // Localhost
    return createPublicClient({
      chain: anvil,
      transport: http("http://127.0.0.1:8545"),
    });
  } else {
    throw new Error(`Unsupported chainId: ${chainId}`);
  }
}
