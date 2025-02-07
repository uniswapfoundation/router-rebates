import { encodePacked, erc20Abi, keccak256, type Address } from "viem";
import { publicClient, wallet1, walletClient } from "./constants";

import { abi as RouterRebatesABI } from "../../../../foundry-contracts/out/RouterRebates.sol/RouterRebates.json";

export async function claimWithSignature(
  rebateContract: Address,
  beneficiary: Address,
  recipient: Address,
  amount: bigint,
  txnHashes: `0x${string}`[],
  startBlockNumber: bigint,
  endBlockNumber: bigint,
  signature: `0x${string}`
) {
  const { request } = await publicClient.simulateContract({
    account: wallet1,
    address: rebateContract,
    abi: RouterRebatesABI,
    functionName: "claimWithSignature",
    args: [
      beneficiary,
      recipient,
      amount,
      txnHashes,
      {
        startBlockNumber: startBlockNumber,
        endBlockNumber: endBlockNumber,
      },
      signature,
    ],
  });
  await walletClient.writeContract(request);
}
