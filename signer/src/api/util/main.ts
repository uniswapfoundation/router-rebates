import { zeroAddress, type Address, type PublicClient } from "viem";
import { calculateRebate, getRebatePerEvent } from "./rebate";
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
  const { rebatePerSwap, rebatePerHook, rebateFixed } =
    await getRebatePerEvent();
  const result = await Promise.all(
    txnHashes.map((txnHash) =>
      calculateRebate(
        publicClient,
        txnHash,
        rebatePerSwap,
        rebatePerHook,
        rebateFixed
      )
    )
  );

  const amount = result.reduce(
    (total: bigint, data) => total + data.gasToRebate,
    0n
  );

  // no rebates were found from the transaction hashes provided
  // early-return to avoid `getRebateClaimer` call and signature generation
  if (amount === 0n) {
    return {
      claimer: zeroAddress,
      signature: "0x0",
      amount: "0",
      startBlockNumber: "0",
      endBlockNumber: "0",
    };
  }

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
