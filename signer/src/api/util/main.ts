import { zeroAddress, type Address, type PublicClient } from "viem";
import { calculateRebate } from "./rebate";
import { getRebateClaimer, sign } from "./signer";
import { MINIMUM_BLOCK_HEIGHT } from "../../constants";

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
  const currentBlockNumber = await publicClient.getBlockNumber();
  const chainId = await publicClient.getChainId();
  let result = await Promise.all(
    txnHashes.map((txnHash) =>
      calculateRebate(
        publicClient,
        currentBlockNumber,
        MINIMUM_BLOCK_HEIGHT[chainId as keyof typeof MINIMUM_BLOCK_HEIGHT],
        txnHash
      )
    )
  );

  // filter out any invalid transactions, where beneficiary is zero address
  result = result.filter((data) => data.beneficiary !== zeroAddress);

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
