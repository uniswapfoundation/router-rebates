import {
  anvil,
  arbitrumSepolia,
  baseSepolia,
  mainnet,
  sepolia,
  unichain,
  unichainSepolia
} from "viem/chains";

export const SUPPORTED_CHAINS: number[] = [
  unichain.id
];

export const MINIMUM_ELIGIBLE_BLOCK_NUMBER = {
  [mainnet.id]: 22547174,
  [unichain.id]: 18839142,
  [sepolia.id]: 0,
  [unichainSepolia.id]: 0,
  [baseSepolia.id]: 0,
  [arbitrumSepolia.id]: 0,
  [anvil.id]: 0
};

// TODO: set to proper values and double check final chainId list
export const MINIMUM_BLOCK_HEIGHT = {
  [mainnet.id]: 10n,
  [unichain.id]: 10n,
  [sepolia.id]: 10n,
  [unichainSepolia.id]: 10n,
  [baseSepolia.id]: 10n,
  [arbitrumSepolia.id]: 10n,
  [anvil.id]: 0
};
