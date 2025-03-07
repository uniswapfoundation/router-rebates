import { describe, test, expect, beforeAll } from "@jest/globals";
import {
  encodePacked,
  getAddress,
  keccak256,
  verifyTypedData,
  Address,
} from "viem";

import ANVIL_ARTIFACT from "../../foundry-contracts/broadcast/Anvil.s.sol/31337/run-latest.json";
import { getContractAddressByContractName } from "./utils/addresses";
import { BASE_URL, publicClient, wallet1 } from "./utils/constants";
import { claimWithSignature } from "./utils/chain";

/// @dev re-using a signature will revert
describe("claim", () => {
  let router01Address: Address;
  let router02Address: Address;

  let rebateAddress: Address;

  beforeAll(() => {
    // Extract the router addresses
    router01Address = getContractAddressByContractName("PoolSwapTestClaimable");

    router02Address = getContractAddressByContractName("UniversalRouter");

    rebateAddress = getContractAddressByContractName("RouterRebates");
  });

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
    expect(txnHashes.length).toBe(12);

    const data = { chainId: 31337, txnHashes: txnHashes };
    const params = new URLSearchParams(data as any).toString();
    const result = await fetch(`${BASE_URL}/sign?${params}`);
    const { claimer, signature, amount, startBlockNumber, endBlockNumber } =
      (await result.json()) as {
        claimer: Address;
        signature: `0x${string}`;
        amount: string;
        startBlockNumber: string;
        endBlockNumber: string;
      };
    expect(claimer).toBe(wallet1.address);

    // recover the signer address
    const valid = await verifyTypedData({
      address: getAddress("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"),
      domain: {
        name: "FOUNDATION",
        version: "1",
        chainId: 31337, // should be the chain where router rebates is deployed
        verifyingContract: getAddress(rebateAddress),
      },
      types: {
        Claimable: [
          { name: "claimer", type: "address" },
          { name: "beneficiary", type: "address" },
          { name: "chainId", type: "uint256" },
          { name: "startBlockNumber", type: "uint128" },
          { name: "endBlockNumber", type: "uint128" },
          { name: "amount", type: "uint256" },
        ],
      },
      primaryType: "Claimable",
      message: {
        claimer: getAddress(claimer),
        beneficiary: getAddress(router01Address),
        chainId: BigInt(31337),
        startBlockNumber: BigInt(startBlockNumber),
        endBlockNumber: BigInt(endBlockNumber),
        amount: BigInt(amount),
      },
      signature: signature,
    });
    expect(valid).toBe(true);

    // sum of block.baseFeePerGas for each txnHash
    const expectedRebate = await Promise.all(
      txnHashes.map(async (txnHash): Promise<bigint> => {
        const receipt = await publicClient.getTransactionReceipt({
          hash: txnHash,
        });
        const block = await publicClient.getBlock({
          blockNumber: receipt.blockNumber,
        });
        let gasToRebate = 160000n; // 80k gas per swap event, + 80k fixed gas
        const maxGasToRebate = (receipt.gasUsed * 80n) / 100n; // rebate a max of 80% of gasUsed
        gasToRebate =
          maxGasToRebate < gasToRebate ? maxGasToRebate : gasToRebate;

        const gasPrice = block.baseFeePerGas!;
        return gasPrice * gasToRebate;
      })
    );
    const totalRebate = expectedRebate.reduce(
      (acc, expectedRebate) => acc + expectedRebate,
      0n
    );
    const tokensClaimed = BigInt(amount);
    expect(tokensClaimed).toBeLessThan(totalRebate);

    const wallet1BalanceBefore: bigint = await publicClient.getBalance({
      address: wallet1.address,
    });

    // wallet1 claims the rebate
    await claimWithSignature(
      BigInt(31337),
      rebateAddress,
      router01Address,
      wallet1.address,
      tokensClaimed,
      BigInt(startBlockNumber),
      BigInt(endBlockNumber),
      signature
    );

    const wallet1BalanceAfter: bigint = await publicClient.getBalance({
      address: wallet1.address,
    });
    expect(wallet1BalanceAfter).toBeLessThanOrEqual(
      wallet1BalanceBefore + tokensClaimed
    ); // balance after is not total claimed amount because some spent on gas
  });
});
