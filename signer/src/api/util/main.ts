import { zeroAddress, type Address, type PublicClient } from "viem";
import { calculateRebate, getRebatePerEvent } from "./rebate";
import { getRebateClaimer, sign } from "./signer";
import { MINIMUM_BLOCK_HEIGHT } from "../../constants";

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
  const currentBlockNumber = await publicClient.getBlockNumber();
  const chainId = await publicClient.getChainId();
  const { rebatePerSwap, rebatePerHook, rebateFixed } =
    await getRebatePerEvent();

  // deduplicate the txnHashes
  const uniqueTxnHashes = Array.from(new Set(txnHashes.map((hash) => hash.toLowerCase() as `0x${string}`)));

  let result = await Promise.all(
    uniqueTxnHashes.map((txnHash) =>
      calculateRebate(
        publicClient,
        currentBlockNumber,
        chainId,
        txnHash,
        beneficiary,
        rebatePerSwap,
        rebatePerHook,
        rebateFixed
      )
    )
  );

  // filter out any invalid transactions, where beneficiary is zero address
  result = result.filter((data) => data.beneficiary !== zeroAddress);

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
    BigInt(chainId),
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
