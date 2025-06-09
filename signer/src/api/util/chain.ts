import { createPublicClient, http, type PublicClient } from "viem";
import {
  anvil,
  arbitrum,
  arbitrumSepolia,
  base,
  baseSepolia,
  mainnet,
  sepolia,
  unichain,
  unichainSepolia
} from "viem/chains";
import { SUPPORTED_CHAINS } from "../../constants";

/**
 * Return a viem PublicClient for the given chainId.
 * @dev The function will return a valid testnet client i.f.f. the rebate contract is deployed on the testnet.
 * If the rebate contract is deployed on a production chain, the function will NOT return a testnet client.
 * @param chainId the chain ID to get the client for.
 * @returns PublicClient or undefined if the chainId is not supported.
 */
export function getClient(chainId: number): PublicClient | undefined {
  if (!SUPPORTED_CHAINS.includes(chainId)) {
    return undefined;
  }

  // the chain ID of the rebate contract will determine if a client will be returned or not
  const rebateContractChainId = process.env.REBATE_CHAIN_ID;

  // note: despite being able to return a valid client, upstream logic will prevent returning valid clients
  // for UNSUPPORTED chains
  if (chainId === 1) {
    return createPublicClient({
      chain: mainnet,
      transport: http(process.env.ETHEREUM_RPC_URL)
    });
  } else if (chainId === 8453) {
    // Base
    return createPublicClient({
      chain: base,
      transport: http(process.env.BASE_RPC_URL)
    });
  } else if (chainId === 42161) {
    // Arbitrum
    return createPublicClient({
      chain: arbitrum,
      transport: http(process.env.ARBITRUM_RPC_URL)
    });
  } else if (chainId === 130) {
    return createPublicClient({
      chain: unichain,
      transport: http(process.env.UNICHAIN_RPC_URL)
    });
  } else if (chainId === 11155111 && rebateContractChainId === "11155111") {
    // Ethereum Sepolia
    return createPublicClient({
      chain: sepolia,
      transport: http(process.env.ETHEREUM_SEPOLIA_RPC_URL)
    });
  } else if (chainId === 84532 && rebateContractChainId === "11155111") {
    // Base Sepolia
    return createPublicClient({
      chain: baseSepolia,
      transport: http(process.env.BASE_SEPOLIA_RPC_URL)
    });
  } else if (chainId === 421614 && rebateContractChainId === "11155111") {
    // Arbitrum Sepolia
    return createPublicClient({
      chain: arbitrumSepolia,
      transport: http(process.env.ARBITRUM_SEPOLIA_RPC_URL)
    });
  } else if (chainId === 1301 && rebateContractChainId === "11155111") {
    return createPublicClient({
      chain: unichainSepolia,
      transport: http(process.env.UNICHAIN_SEPOLIA_RPC_URL)
    });
  } else if (
    chainId === 31337 &&
    (rebateContractChainId === "11155111" || rebateContractChainId === "31337")
  ) {
    // Localhost
    return createPublicClient({
      chain: anvil,
      transport: http("http://127.0.0.1:8545")
    });
  } else {
    return undefined;
  }
}
