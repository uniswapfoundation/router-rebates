import type { Address, PublicClient } from "viem";
import { calculateRebate } from "./rebate";
import { getRebateClaimer, sign } from "./signer";

export async function batch(
  publicClient: PublicClient,
  txnHashes: `0x${string}`[]
): Promise<{
  claimer: Address;
  signature: `0x${string}`;
  amount: string;
  startBlockNumber: string;
  endBlockNumber: string;
}> {
  const result = await Promise.all(
    txnHashes.map((txnHash) => calculateRebate(publicClient, txnHash))
  );

  const amount = result.reduce(
    (total: bigint, data) => total + data.gasToRebate,
    0n
  );
  const beneficiary: `0x${string}` = result[0].beneficiary;
  const claimer = await getRebateClaimer(publicClient, beneficiary);
  const startBlockNumber = result.reduce(
    (min: bigint, data) => (data.blockNumber < min ? data.blockNumber : min),
    result[0].blockNumber
  );
  const endBlockNumber = result.reduce(
    (max: bigint, data) => (data.blockNumber > max ? data.blockNumber : max),
    result[0].blockNumber
  );

  const signature = await sign(
    claimer,
    beneficiary,
    BigInt(await publicClient.getChainId()),
    txnHashes,
    startBlockNumber,
    endBlockNumber,
    amount
  );

  return {
    claimer,
    signature,
    amount: amount.toString(),
    startBlockNumber: startBlockNumber.toString(),
    endBlockNumber: endBlockNumber.toString(),
  };
}
