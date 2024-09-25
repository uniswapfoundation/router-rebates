import { expect, test, beforeAll } from "bun:test";
import { parseGwei, type Address } from "viem";

import ANVIL_ARTIFACT from "../../broadcast/Anvil.s.sol/31337/run-latest.json";
import { getContractAddressByContractName } from "./utils/addresses";
import { BASE_URL, publicClient, wallet1 } from "./utils/constants";
import { claimRebates, rewardTokenBalanceOf } from "./utils/chain";

let router01Address: Address;
let router02Address: Address;

let rebateAddress: Address;

let singleHopHash: `0x${string}`;

let rewardTokenAddress: Address;

beforeAll(() => {
  // Extract the router addresses
  router01Address = getContractAddressByContractName("PoolSwapTestClaimable");

  router02Address = getContractAddressByContractName("UniversalRouter");

  rebateAddress = getContractAddressByContractName("SignatureRebates");

  singleHopHash = ANVIL_ARTIFACT.transactions.find(
    (transaction) =>
      transaction.transactionType === "CALL" &&
      transaction.contractAddress === router01Address &&
      transaction.function?.startsWith("swap")
  )?.hash as `0x${string}`;

  // extract the reward token based on campaign creation
  rewardTokenAddress = ANVIL_ARTIFACT.transactions.find(
    (transaction) =>
      transaction.transactionType === "CALL" &&
      transaction.contractAddress === rebateAddress &&
      transaction.function?.startsWith("createCampaign")
  )?.arguments![1] as `0x${string}`;
});

/// @dev a valid signature is used to claim tokens
// test("single hop hash", async () => {
//   const result = await fetch(`${API_URL}/${singleHopHash}`);
//   const { signature, amountMax } = (await result.json()) as {
//     signature: `0x${string}`;
//     amountMax: string;
//   };

//   const wallet1BalanceBefore: bigint = await rewardTokenBalanceOf(
//     rewardTokenAddress,
//     wallet1.address
//   );

//   // wallet1 claims the rebate
//   await claimRebate(
//     router01Address,
//     wallet1.address,
//     1n,
//     singleHopHash,
//     BigInt(amountMax),
//     signature
//   );

//   const wallet1BalanceAfter: bigint = await rewardTokenBalanceOf(
//     rewardTokenAddress,
//     wallet1.address
//   );
//   expect(wallet1BalanceAfter).toBe(wallet1BalanceBefore + 1n);
// });

/// @dev re-using a signature will revert

/// @dev batch transaction hashes
test("batch claim", async () => {
  const txnHashes = ANVIL_ARTIFACT.transactions
    .filter(
      (transaction) =>
        transaction.transactionType === "CALL" &&
        transaction.contractAddress === router01Address &&
        transaction.function?.startsWith("swap")
    )
    .map((txn) => txn.hash)
    .sort() as `0x${string}`[];
  expect(txnHashes.length).toBe(4);

  const data = { campaignId: "0", txnHashes: txnHashes };
  const params = new URLSearchParams(data as any).toString();
  const result = await fetch(`${BASE_URL}/sign?${params}`);
  const { signature, amount } = (await result.json()) as {
    signature: `0x${string}`;
    amount: string;
  };

  // sum of block.baseFeePerGas for each txnHash
  const baseFees = await Promise.all(
    txnHashes.map(async (txnHash): Promise<bigint> => {
      const receipt = await publicClient.getTransactionReceipt({
        hash: txnHash,
      });
      const block = await publicClient.getBlock({
        blockNumber: receipt.blockNumber,
      });
      console.log(block.baseFeePerGas);
      return block.baseFeePerGas!;
    })
  );
  const totalBaseFee = baseFees.reduce((acc, baseFee) => acc + baseFee, 0n);
  console.log(totalBaseFee);

  const tokensClaimed = BigInt(amount);
  expect(tokensClaimed).toBe(80_000n * totalBaseFee);

  const wallet1BalanceBefore: bigint = await rewardTokenBalanceOf(
    rewardTokenAddress,
    wallet1.address
  );

  // wallet1 claims the rebate
  await claimRebates(
    router01Address,
    0n,
    wallet1.address,
    tokensClaimed,
    txnHashes,
    signature
  );

  const wallet1BalanceAfter: bigint = await rewardTokenBalanceOf(
    rewardTokenAddress,
    wallet1.address
  );
  expect(wallet1BalanceAfter).toBe(wallet1BalanceBefore + tokensClaimed);
});
