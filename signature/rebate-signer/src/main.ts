import { Database } from "bun:sqlite";
import type { Address, PublicClient } from "viem";
import { calculateRebate } from "./rebate";
import { getRebateClaimer, sign } from "./signer";

export async function batch(
  db: Database,
  publicClient: PublicClient,
  txnHashes: `0x${string}`[]
): Promise<{
  claimer: Address;
  signature: `0x${string}`;
  amount: string;
  lastBlockNumber: string;
}> {
  const result = await Promise.all(
    txnHashes.map((txnHash) => calculateRebate(db, publicClient, txnHash))
  );
  // TODO: error if multiple referrers

  const amount = result.reduce(
    (total: bigint, data) => total + data.gasToRebate,
    0n
  );
  const beneficiary: `0x${string}` = result[0].beneficiary;
  const claimer = await getRebateClaimer(beneficiary);
  const lastBlockNumber = BigInt(88888);

  const signature = await sign(
    claimer,
    beneficiary,
    txnHashes,
    lastBlockNumber,
    amount
  );

  return {
    claimer,
    signature,
    amount: amount.toString(),
    lastBlockNumber: lastBlockNumber.toString(),
  };
}
