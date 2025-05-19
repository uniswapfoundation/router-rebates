import { eq } from "drizzle-orm";
import {
  parseAbi,
  parseAbiItem,
  parseEventLogs,
  zeroAddress,
  type Address,
  type PublicClient,
} from "viem";
import { getClient } from "./chain";
import schema from "ponder:schema";
import { db as dbClient } from "ponder:api";

const abi = parseAbi([
  "event Swap(bytes32 indexed id, address indexed sender, int128 amount0, int128 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick, uint24 fee)",
]);

export function getUNIFromETHAmount(ethAmount: bigint): bigint {
  return BigInt(0);
}

/// @dev rebates are only calculated for the first swap router
export async function calculateRebate(
  client: PublicClient,
  txnHash: `0x${string}`,
  rebatePerSwap: bigint,
  rebatePerHook: bigint,
  rebateFixed: bigint
): Promise<{
  beneficiary: Address;
  gasToRebate: bigint;
  txnHash: `0x${string}`;
  blockNumber: bigint;
}> {
  const txnReceipt = await client.getTransactionReceipt({ hash: txnHash });

  // Use baseFee and do not use priorityFee, otherwise miners will set a high priority fee (paid back to themselves)
  // and be able to wash trade
  const gasPrice = (
    await client.getBlock({ blockNumber: txnReceipt.blockNumber })
  ).baseFeePerGas!;

  const swapEvents = parseEventLogs({
    abi: abi,
    logs: txnReceipt.logs,
  }).filter((log) => log.eventName === "Swap");

  if (swapEvents.length === 0) {
    return {
      beneficiary: zeroAddress,
      gasToRebate: 0n,
      txnHash: "0x0",
      blockNumber: 0n,
    };
  }

  const beneficiary: Address = swapEvents[0].args.sender;

  // note: within a transaction hash there may be multiple swap routers
  // this is different than signing for a batch of transaction hashes
  // TODO: require all events are from the same sender

  // iterate each swap event, calculating the rebate for the sender (swap router)
  const rebates = await Promise.all(
    swapEvents.map(async (swapEvent) => {
      const { id } = swapEvent.args;
      const result = await dbClient
        .select({ hooks: schema.pool.hooks })
        .from(schema.pool)
        .where(eq(schema.pool.poolId, id));

      if (result.length > 0 && result[0]?.hooks !== zeroAddress) {
        return rebatePerSwap + rebatePerHook;
      } else {
        return 0n;
      }
    })
  );
  let gasUsedToRebate = rebates.reduce((total, rebate) => total + rebate, 0n);

  // append the fixed rebate for token transfers
  if (gasUsedToRebate != 0n) gasUsedToRebate += rebateFixed;

  const maxGasToRebate = (txnReceipt.gasUsed * 80n) / 100n; // rebate a max of 80% of gasUsed
  gasUsedToRebate =
    maxGasToRebate < gasUsedToRebate ? maxGasToRebate : gasUsedToRebate;

  return {
    beneficiary,
    gasToRebate: gasUsedToRebate * gasPrice,
    blockNumber: txnReceipt.blockNumber,
  };
}

export async function getRebatePerEvent(): Promise<{
  rebatePerSwap: bigint;
  rebatePerHook: bigint;
  rebateFixed: bigint;
}> {
  const client = getClient(Number(process.env.REBATE_CHAIN_ID));
  const rebatePerSwap = await client.readContract({
    address: process.env.REBATE_ADDRESS as Address,
    abi: [parseAbiItem("function rebatePerSwap() view returns (uint256)")],
    functionName: "rebatePerSwap",
  });
  const rebatePerHook = await client.readContract({
    address: process.env.REBATE_ADDRESS as Address,
    abi: [parseAbiItem("function rebatePerHook() view returns (uint256)")],
    functionName: "rebatePerHook",
  });
  const rebateFixed = await client.readContract({
    address: process.env.REBATE_ADDRESS as Address,
    abi: [parseAbiItem("function rebateFixed() view returns (uint256)")],
    functionName: "rebateFixed",
  });
  return { rebatePerSwap, rebatePerHook, rebateFixed };
}
