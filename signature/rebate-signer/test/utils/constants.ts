import { createPublicClient, createWalletClient, http } from "viem";
import { anvil, mainnet } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

import ARTIFACT from "../../../../foundry-contracts/broadcast/Anvil.s.sol/31337/run-latest.json";

export const ANVIL_ARTIFACT = ARTIFACT;

export const BASE_URL = "http://localhost:3000";

export const API_URL = `${BASE_URL}/31337`;

export const wallet0 = privateKeyToAccount(
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
);
export const wallet1 = privateKeyToAccount(
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
);

export const publicClient = createPublicClient({
  chain: mainnet,
  transport: http("http://localhost:8545"),
});

export const walletClient = createWalletClient({
  account: wallet1,
  chain: mainnet,
  transport: http("http://localhost:8545"),
});
