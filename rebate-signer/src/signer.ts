import { privateKeyToAccount } from "viem/accounts";

const types = {
  Claimable: [
    { name: "referrer", type: "address" },
    { name: "transactionHash", type: "bytes32" },
    { name: "amountMax", type: "uint256" },
  ],
  ClaimableBatch: [
    { name: "campaignId", type: "uint256" },
    { name: "referrer", type: "address" },
    { name: "transactionHashes", type: "bytes32[]" },
    { name: "amount", type: "uint256" },
  ],
};

export async function sign(
  referrer: `0x${string}`,
  txnHash: `0x${string}`,
  amountMax: bigint
): Promise<`0x${string}`> {
  const account = privateKeyToAccount(
    process.env.ETH_PRIVATE_KEY as `0x${string}`
  );

  const signature = await account.signTypedData({
    domain: {
      name: process.env.REBATE_CONTRACT_NAME,
      version: process.env.REBATE_CONTRACT_VERSION,
      chainId: 31337,
      verifyingContract: process.env.REBATE_ADDRESS as `0x${string}`,
    },
    types: types,
    primaryType: "Claimable",
    message: {
      referrer: referrer,
      transactionHash: txnHash,
      amountMax: amountMax,
    },
  });
  return signature;
}

export async function signBatch(
  campaignId: bigint,
  referrer: `0x${string}`,
  txnHashes: `0x${string}`[],
  amount: bigint
): Promise<`0x${string}`> {
  const account = privateKeyToAccount(
    process.env.ETH_PRIVATE_KEY as `0x${string}`
  );

  const signature = await account.signTypedData({
    domain: {
      name: process.env.REBATE_CONTRACT_NAME,
      version: process.env.REBATE_CONTRACT_VERSION,
      chainId: 31337,
      verifyingContract: process.env.REBATE_ADDRESS as `0x${string}`,
    },
    types: types,
    primaryType: "ClaimableBatch",
    message: {
      campaignId: campaignId,
      referrer: referrer,
      transactionHashes: txnHashes,
      amount: amount,
    },
  });
  return signature;
}
