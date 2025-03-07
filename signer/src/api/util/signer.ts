import { privateKeyToAccount } from "viem/accounts";
import { getAddress, parseAbiItem, type PublicClient } from "viem";

const types = {
  Claimable: [
    { name: "claimer", type: "address" },
    { name: "beneficiary", type: "address" },
    { name: "chainId", type: "uint256" },
    { name: "startBlockNumber", type: "uint128" },
    { name: "endBlockNumber", type: "uint128" },
    { name: "amount", type: "uint256" },
  ],
};

export async function sign(
  claimer: `0x${string}`,
  beneficiary: `0x${string}`,
  chainId: bigint,
  startBlockNumber: bigint,
  endBlockNumber: bigint,
  amount: bigint
): Promise<`0x${string}`> {
  const account = privateKeyToAccount(
    process.env.ETH_SIGNER_PRIVATE_KEY as `0x${string}`
  );

  const signature = await account.signTypedData({
    domain: {
      name: process.env.REBATE_CONTRACT_NAME,
      version: process.env.REBATE_CONTRACT_VERSION,
      chainId: Number(process.env.REBATE_CHAIN_ID),
      verifyingContract: getAddress(
        process.env.REBATE_ADDRESS as `0x${string}`
      ),
    },
    types: types,
    primaryType: "Claimable",
    message: {
      claimer: getAddress(claimer),
      beneficiary: getAddress(beneficiary),
      chainId: chainId,
      startBlockNumber: startBlockNumber,
      endBlockNumber: endBlockNumber,
      amount: amount,
    },
  });
  return signature;
}

export async function getRebateClaimer(
  publicClient: PublicClient,
  beneficiary: `0x${string}`
): Promise<`0x${string}`> {
  return await publicClient.readContract({
    address: beneficiary,
    abi: [parseAbiItem("function rebateClaimer() view returns (address)")],
    functionName: "rebateClaimer",
  });
}
