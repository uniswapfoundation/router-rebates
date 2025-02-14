import {
  createWalletClient,
  encodePacked,
  erc20Abi,
  http,
  keccak256,
  type Address,
} from "viem";
import { publicClient, wallet1, walletClient } from "./constants";

import { abi as RouterRebatesABI } from "../../../foundry-contracts/out/RouterRebates.sol/RouterRebates.json";
import { anvil } from "viem/chains";

export async function claimWithSignature(
  chainId: bigint,
  rebateContract: Address,
  beneficiary: Address,
  recipient: Address,
  amount: bigint,
  txnListHash: `0x${string}`,
  startBlockNumber: bigint,
  endBlockNumber: bigint,
  signature: `0x${string}`
) {
  const { request } = await publicClient.simulateContract({
    account: wallet1,
    address: rebateContract,
    abi: RouterRebatesABI,
    functionName: "claimWithSignature",
    args: [
      chainId,
      beneficiary,
      recipient,
      amount,
      txnListHash,
      {
        startBlockNumber: startBlockNumber,
        endBlockNumber: endBlockNumber,
      },
      signature,
    ],
  });
  await walletClient.writeContract(request);
}
