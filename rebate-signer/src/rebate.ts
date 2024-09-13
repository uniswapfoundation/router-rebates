import type { Client, PublicClient, TransactionReceipt } from "viem";

export function getGasPerSwap(): bigint {
  return BigInt(0);
}

export function getMaxGasPerHook(): bigint {
  return BigInt(0);
}

export function getUNIFromETHAmount(ethAmount: bigint): bigint {
  return BigInt(0);
}

export function calculateRebate(
  client: PublicClient,
  txnHash: `0x${string}`
): bigint {
  client
    .getTransactionReceipt({ hash: txnHash })
    .then((receipt: TransactionReceipt) => {
      receipt.logs.forEach((log) => {
        console.log(log);

        // for each swap event
      });
    });
  return BigInt(0);
}
