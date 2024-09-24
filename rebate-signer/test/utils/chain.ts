import { erc20Abi, type Address } from "viem";
import { publicClient, wallet1, walletClient } from "./constants";

import { abi as ClaimooorABI } from "../../../out/Claimooor.sol/Claimooor.json";

export async function rewardTokenBalanceOf(
  rewardTokenAddress: Address,
  owner: Address
): Promise<bigint> {
  return await publicClient.readContract({
    address: rewardTokenAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [owner],
  });
}

export async function claimRebate(
  claimer: Address,
  recipient: Address,
  amountToClaim: bigint,
  txnHash: `0x${string}`,
  amountMax: bigint,
  signature: `0x${string}`
) {
  const { request } = await publicClient.simulateContract({
    account: wallet1,
    address: claimer,
    abi: ClaimooorABI,
    functionName: "claimRebate",
    args: [
      0n, // TODO: grab the last campaign id
      recipient,
      amountToClaim,
      txnHash,
      amountMax,
      signature,
    ],
  });
  await walletClient.writeContract(request);
}

export async function claimRebates(
  claimer: Address,
  campaignId: bigint,
  recipient: Address,
  amount: bigint,
  txnHashes: `0x${string}`[],
  signature: `0x${string}`
) {
  const { request } = await publicClient.simulateContract({
    account: wallet1,
    address: claimer,
    abi: ClaimooorABI,
    functionName: "claimRebates",
    args: [campaignId, recipient, amount, txnHashes, signature],
  });
  await walletClient.writeContract(request);
}

// const r = await publicClient.readContract({
//   address: rebateAddress,
//   abi: SignatureRebatesABI,
//   functionName: "campaigns",
//   args: [0n],
// });
