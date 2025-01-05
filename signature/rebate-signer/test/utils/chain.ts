import { erc20Abi, type Address } from "viem";
import { publicClient, wallet1, walletClient } from "./constants";

import { abi as SignatureRebatesABI } from "../../../out/SignatureRebates.sol/SignatureRebates.json";
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

export async function getCampaign(
  rebateAddress: Address,
  campaignId: bigint
): Promise<{
  gasPerSwap: bigint;
  maxGasPerHook: bigint;
  rewardSupply: bigint;
  token: Address;
  owner: Address;
}> {
  const result = (await publicClient.readContract({
    address: rebateAddress,
    abi: SignatureRebatesABI,
    functionName: "campaigns",
    args: [campaignId],
  })) as any[];
  return {
    gasPerSwap: result[0],
    maxGasPerHook: result[1],
    rewardSupply: result[2],
    token: result[3],
    owner: result[4],
  };
}
