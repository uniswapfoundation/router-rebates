import { expect, test, beforeAll } from "bun:test";
import { type Address } from "viem";

import ANVIL_ARTIFACT from "../../broadcast/Anvil.s.sol/31337/run-latest.json";
import { getContractAddressByContractName } from "./utils/addresses";
import { API_URL, wallet1 } from "./utils/constants";
import { claimRebate, rewardTokenBalanceOf } from "./utils/chain";

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
test("single hop hash", async () => {
  const result = await fetch(`${API_URL}/${singleHopHash}`);
  const { signature, amountMax } = (await result.json()) as {
    signature: `0x${string}`;
    amountMax: string;
  };

  const wallet1BalanceBefore: bigint = await rewardTokenBalanceOf(
    rewardTokenAddress,
    wallet1.address
  );

  // wallet1 claims the rebate
  await claimRebate(
    router01Address,
    wallet1.address,
    1n,
    singleHopHash,
    BigInt(amountMax),
    signature
  );

  const wallet1BalanceAfter: bigint = await rewardTokenBalanceOf(
    rewardTokenAddress,
    wallet1.address
  );
  expect(wallet1BalanceAfter).toBe(wallet1BalanceBefore + 1n);
});

/// @dev re-using a signature will revert
