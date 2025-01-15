import { privateKeyToAccount } from "viem/accounts";
import {
  createPublicClient,
  encodePacked,
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
    { name: "lastBlockNumber", type: "uint256" },
    { name: "amount", type: "uint256" },
  ],
};

export async function sign(
  claimer: `0x${string}`,
  beneficiary: `0x${string}`,
  txnHashes: `0x${string}`[],
  lastBlockNumber: bigint,
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
    primaryType: "Claimable",
    message: {
      claimer: claimer,
      beneficiary: beneficiary,
      hashedTxns: keccak256(encodePacked(["bytes32[]"], [txnHashes.sort()])),
      lastBlockNumber: lastBlockNumber,
      amount: amount,
    },
  });
  console.log("SIGNED");
  console.log(claimer, beneficiary);
  console.log(lastBlockNumber);
  console.log(amount);
  console.log(signature);
  console.log(keccak256(encodePacked(["bytes32[]"], [txnHashes.sort()])));
  console.log("----------------");
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
