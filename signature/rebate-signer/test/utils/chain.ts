import { erc20Abi, type Address } from "viem";
import { publicClient, wallet1, walletClient } from "./constants";

import { abi as SignatureRebatesABI } from "../../../../foundry-contracts/out/SignatureRebates.sol/SignatureRebates.json";

export async function claimWithSignature(
  rebateContract: Address,
  beneficiary: Address,
  recipient: Address,
  amount: bigint,
  txnHashes: `0x${string}`[],
  lastBlockNumber: bigint,
  signature: `0x${string}`
) {
  const { request } = await publicClient.simulateContract({
    account: wallet1,
    address: rebateContract,
    abi: SignatureRebatesABI,
    functionName: "claimWithSignature",
    args: [
      beneficiary,
      recipient,
      amount,
      txnHashes,
      lastBlockNumber,
      signature,
    ],
  });
  await walletClient.writeContract(request);
}
