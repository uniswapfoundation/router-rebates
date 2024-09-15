import { privateKeyToAccount } from "viem/accounts";

const types = {
  Claimable: [
    { name: "referrer", type: "address" },
    { name: "transactionHash", type: "bytes32" },
    { name: "amountMax", type: "uint256" },
  ],
};

export async function sign(
  referrer: `0x${string}`,
  txnHash: `0x${string}`,
  amountMax: bigint
): Promise<`0x${string}`> {
  const account = privateKeyToAccount(
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
  );

  const signature = await account.signTypedData({
    domain: {
      name: "FOUNDATION",
      version: "1",
      chainId: 31337,
      verifyingContract: "0x0b306bf915c4d645ff596e518faf3f9669b97016",
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
