import { Database } from "bun:sqlite";
import type { PublicClient } from "viem";
import { calculateRebate } from "./rebate";
import { sign, signBatch } from "./signer";

export async function single(
  publicClient: PublicClient,
  campaignId: bigint,
  txnHash: `0x${string}`
): Promise<{ signature: `0x${string}`; amountMax: string }> {
  const { referrer, gasToRebate } = await calculateRebate(
    publicClient,
    campaignId,
    txnHash
  );
  const signature = await sign(referrer, txnHash, gasToRebate);
  return { signature, amountMax: gasToRebate.toString() }; // todo convert gas to token amount
}

export async function batch(
  db: Database,
  publicClient: PublicClient,
  campaignId: bigint,
  txnHashes: `0x${string}`[]
): Promise<{ signature: `0x${string}`; amount: string }> {
  const result = await Promise.all(
    txnHashes.map((txnHash) =>
      calculateRebate(db, publicClient, campaignId, txnHash)
    )
  );
  // TODO: error if multiple referrers

  const amount = result.reduce(
    (total: bigint, data) => total + data.gasToRebate,
    0n
  );

  // TODO: convert gas-rebate (ETH) to reward token

  const signature = await signBatch(
    campaignId,
    result[0].referrer,
    txnHashes,
    amount
  );

  return { signature, amount: amount.toString() };
}
