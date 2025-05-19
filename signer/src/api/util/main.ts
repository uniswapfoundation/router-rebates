import type { Address, PublicClient } from "viem";
import { calculateRebate } from "./rebate";
import { getRebateClaimer, sign } from "./signer";

export async function batch(
  publicClient: PublicClient,
  txnHashes: `0x${string}`[],
  beneficiary: Address
): Promise<{
  claimer: Address;
  signature: `0x${string}`;
  amount: string;
  startBlockNumber: string;
  endBlockNumber: string;
}> {
  let result = await Promise.all(
    txnHashes.map((txnHash) => calculateRebate(publicClient, txnHash))
  );

  // filter out any rebates that do not correlate to the beneficiary
  result = result.filter((data) => data.beneficiary === beneficiary);

  const amount = result.reduce(
    (total: bigint, data) => total + data.gasToRebate,
    0n
  );
  const claimer = await getRebateClaimer(publicClient, beneficiary);
  const startBlockNumber = result.reduce(
    (min: bigint, data) => (data.blockNumber < min ? data.blockNumber : min),
    BigInt(Number.MAX_SAFE_INTEGER)
  );
  const endBlockNumber = result.reduce(
    (max: bigint, data) => (data.blockNumber > max ? data.blockNumber : max),
    0n
  );

  const signature = await sign(
    claimer,
    beneficiary,
    BigInt(await publicClient.getChainId()),
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
