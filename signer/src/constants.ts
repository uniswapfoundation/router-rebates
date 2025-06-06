import {
  anvil,
  arbitrum,
  arbitrumSepolia,
  base,
  baseSepolia,
  mainnet,
  optimism,
  sepolia,
  unichain,
  unichainSepolia
} from "viem/chains";

export const SUPPORTED_CHAINS: number[] = [
  mainnet.id,
  unichain.id,
  sepolia.id,
  baseSepolia.id,
  arbitrumSepolia.id,
  unichainSepolia.id,
  anvil.id
];

export const MINIMUM_ELIGIBLE_BLOCK_NUMBER = {
  [mainnet.id]: 22547174,
  [arbitrum.id]: 339767609,
  [optimism.id]: 136212212,
  [base.id]: 30616930,
  [unichain.id]: 17274865,
  [sepolia.id]: 7258946,
  [baseSepolia.id]: 26130748
};

// TODO: set to proper values and double check final chainId list
export const MINIMUM_BLOCK_HEIGHT = {
  [mainnet.id]: 10n,
  [arbitrum.id]: 10n,
  [optimism.id]: 10n,
  [base.id]: 10n,
  [unichain.id]: 10n,
  [sepolia.id]: 10n,
  [baseSepolia.id]: 10n
};
