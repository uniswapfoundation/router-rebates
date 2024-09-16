import type { PublicClient } from "viem";
import { calculateRebate } from "./rebate";
import { sign } from "./signer";

export async function main(
  publicClient: PublicClient,
  txnHash: `0x${string}`
): Promise<{ signature: `0x${string}`; amountMax: string }> {
  const { referrer, gasToRebate } = await calculateRebate(
    publicClient,
    txnHash
  );
  const signature = await sign(referrer, txnHash, gasToRebate);
  return { signature, amountMax: gasToRebate.toString() }; // todo convert gas to token amount
}
