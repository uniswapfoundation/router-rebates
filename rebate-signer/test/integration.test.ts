import { expect, test, beforeAll } from "bun:test";
import {
  createPublicClient,
  createWalletClient,
  erc20Abi,
  http,
  type Address,
} from "viem";
import { anvil } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

import ANVIL_ARTIFACT from "../../broadcast/Anvil.s.sol/31337/run-latest.json";
import { abi as PoolSwapTestClaimableABI } from "../../out/PoolSwapTestClaimable.sol/PoolSwapTestClaimable.json";
import { abi as SignatureRebatesABI } from "../../out/SignatureRebates.sol/SignatureRebates.json";

const API_URL = "http://localhost:3000/31337";

const wallet0 = privateKeyToAccount(
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
);
const wallet1 = privateKeyToAccount(
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
);

const publicClient = createPublicClient({
  chain: anvil, // TODO: Use the correct chain
  transport: http(),
});

const walletClient = createWalletClient({
  account: wallet1,
  chain: anvil,
  transport: http(),
});

const router01 = "PoolSwapTestClaimable";
let router01Address: `0x${string}`;
const router02 = "UniversalRouter";
let router02Address: string | undefined;

const rebate = "SignatureRebates";
let rebateAddress: Address;

let singleHopHash: `0x${string}`;

let rewardTokenAddress: Address;

beforeAll(() => {
  // Extract the router addresses
  const routerDeployments = ANVIL_ARTIFACT.transactions.filter(
    (transaction) =>
      transaction.transactionType === "CREATE" &&
      (transaction.contractName === router01 ||
        transaction.contractName === router02)
  );
  router01Address = routerDeployments.find(
    (transaction) => transaction.contractName === router01
  )?.contractAddress as `0x${string}`;

  router02Address = routerDeployments.find(
    (transaction) => transaction.contractName === router02
  )?.contractAddress;

  rebateAddress = ANVIL_ARTIFACT.transactions.find(
    (transaction) =>
      transaction.transactionType === "CREATE" &&
      transaction.contractName === rebate
  )?.contractAddress as `0x${string}`;

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

async function rewardTokenBalanceOf(owner: Address): Promise<bigint> {
  return await publicClient.readContract({
    address: rewardTokenAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [owner],
  });
}

async function claimRebate(
  recipient: Address,
  amountToClaim: bigint,
  txnHash: `0x${string}`,
  amountMax: bigint,
  signature: `0x${string}`
) {
  const { request } = await publicClient.simulateContract({
    account: wallet1,
    address: router01Address,
    abi: PoolSwapTestClaimableABI,
    functionName: "claimRebate",
    args: [
      0n, // TODO: grab the last campaign id
      recipient,
      amountToClaim,
      txnHash,
      amountMax,
      signature,
    ],
  });
  // await walletClient.writeContract(request);
}

/// @dev a valid signature is used to claim tokens
test("single hop hash", async () => {
  console.log(router01Address);
  console.log(singleHopHash);
  const result = await fetch(`${API_URL}/${singleHopHash}`);
  const { signature, amountMax } = (await result.json()) as {
    signature: `0x${string}`;
    amountMax: string;
  };

  console.log(signature);
  console.log(amountMax);

  const r = await publicClient.readContract({
    address: rebateAddress,
    abi: SignatureRebatesABI,
    functionName: "campaigns",
    args: [0n],
  });
  console.log(r);

  const wallet1Balance: bigint = await rewardTokenBalanceOf(wallet1.address);
  console.log(wallet1Balance);

  // wallet1 claims the rebate
  await claimRebate(
    wallet1.address,
    1n,
    singleHopHash,
    BigInt(amountMax),
    signature
  );

  const wallet1BalanceAfter: bigint = await rewardTokenBalanceOf(
    wallet1.address
  );
  console.log(wallet1BalanceAfter);
});

/// @dev re-using a signature will revert
