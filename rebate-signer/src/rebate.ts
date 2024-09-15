import {
  parseAbi,
  parseEventLogs,
  type Address,
  type PublicClient,
  type TransactionReceipt,
} from "viem";

const abi = parseAbi([
  "event Swap(bytes32 indexed id, address indexed sender, int128 amount0, int128 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick, uint24 fee)",
]);

export function getGasPerSwap(): bigint {
  return BigInt(0);
}

export function getMaxGasPerHook(): bigint {
  return BigInt(0);
}

export function getUNIFromETHAmount(ethAmount: bigint): bigint {
  return BigInt(0);
}

/// @dev rebates are only calculated for the first swap router
export async function calculateRebate(
  client: PublicClient,
  txnHash: `0x${string}`
): Promise<{ referrer: Address; gasToRebate: bigint }> {
  return client
    .getTransactionReceipt({ hash: txnHash })
    .then((receipt: TransactionReceipt) => {
      const gasPrice: bigint = receipt.effectiveGasPrice; // TODO: how do we exclude priority gas, otherwise miners will pay themselves
      const swapEvents = parseEventLogs({
        abi: abi,
        logs: receipt.logs,
      }).filter((log) => log.eventName === "Swap");

      // TODO: handle txnHashes without swap event

      const referrer: Address = swapEvents[0].args.sender;

      // TODO: require all events are from the same sender

      // iterate each swap event, calculating the rebate for the sender (swap router)
      let gasToRebate: bigint = 0n;
      swapEvents.forEach((swapEvent) => {
        // const { id } = swapEvent.args;
        // TODO: poolId => poolKey => hook

        gasToRebate += 100_000n;
      });
      return { referrer, gasToRebate };
    });
}
