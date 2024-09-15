import type { PublicClient } from "viem";
import { calculateRebate } from "./rebate";
import { sign } from "./signer";

export async function main(
  publicClient: PublicClient,
  txnHash: `0x${string}`
): Promise<`0x${string}`> {
  const { referrer, gasToRebate } = await calculateRebate(
    publicClient,
    txnHash
  );
  const signature = await sign(referrer, txnHash, gasToRebate);
  return signature;
}
