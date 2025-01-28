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
  startBlockNumber: string;
  endBlockNumber: string;
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
  const startBlockNumber = BigInt(1);
  const endBlockNumber = BigInt(9999);

  const signature = await sign(
    claimer,
    beneficiary,
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
