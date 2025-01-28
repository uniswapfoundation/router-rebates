import { privateKeyToAccount } from "viem/accounts";
import {
  createPublicClient,
  encodePacked,
  getAddress,
  http,
  keccak256,
  parseAbiItem,
} from "viem";
import { mainnet } from "viem/chains";

const types = {
  Claimable: [
    { name: "claimer", type: "address" },
    { name: "beneficiary", type: "address" },
    { name: "hashedTxns", type: "bytes32" },
    { name: "startBlockNumber", type: "uint256" },
    { name: "endBlockNumber", type: "uint256" },
    { name: "amount", type: "uint256" },
  ],
};

export async function sign(
  claimer: `0x${string}`,
  beneficiary: `0x${string}`,
  txnHashes: `0x${string}`[],
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
      chainId: 31337,
      verifyingContract: getAddress(
        process.env.REBATE_ADDRESS as `0x${string}`
      ),
    },
    types: types,
    primaryType: "Claimable",
    message: {
      claimer: getAddress(claimer),
      beneficiary: getAddress(beneficiary),
      hashedTxns: keccak256(encodePacked(["bytes32[]"], [txnHashes.sort()])),
      startBlockNumber: startBlockNumber,
      endBlockNumber: endBlockNumber,
      amount: amount,
    },
  });
  return signature;
}

export async function getRebateClaimer(
  beneficiary: `0x${string}`
): Promise<`0x${string}`> {
  const mainnetClient = createPublicClient({
    chain: mainnet,
    transport: http(process.env.MAINNET_RPC_URL),
  });
  return await mainnetClient.readContract({
    address: beneficiary,
    abi: [parseAbiItem("function rebateClaimer() view returns (address)")],
    functionName: "rebateClaimer",
  });
}
