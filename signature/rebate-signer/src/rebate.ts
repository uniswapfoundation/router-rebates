import { Database } from "bun:sqlite";
import {
  parseAbi,
  parseAbiItem,
  parseEventLogs,
  zeroAddress,
  type Address,
  type PublicClient,
  type TransactionReceipt,
} from "viem";
import { getCampaign } from "../test/utils/chain";

const abi = parseAbi([
  "event Swap(bytes32 indexed id, address indexed sender, int128 amount0, int128 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick, uint24 fee)",
]);

export function getUNIFromETHAmount(ethAmount: bigint): bigint {
  return BigInt(0);
}

/// @dev rebates are only calculated for the first swap router
export async function calculateRebate(
  db: Database,
  client: PublicClient,
  txnHash: `0x${string}`
): Promise<{ beneficiary: Address; gasToRebate: bigint }> {
  const txnReceipt = await client.getTransactionReceipt({ hash: txnHash });
  const { rebatePerSwap, rebatePerHook } = await getRebatePerEvent(client);

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
    return { beneficiary: zeroAddress, gasToRebate: 0n };
  }

  const beneficiary: Address = swapEvents[0].args.sender;

  // note: within a transaction hash there may be multiple swap routers
  // this is different than signing for a batch of transaction hashes
  // TODO: require all events are from the same sender

  // iterate each swap event, calculating the rebate for the sender (swap router)
  // let gasToRebate: bigint = 0n;
  let gasUsedToRebate = swapEvents.reduce(
    (gasUsedToRebate: bigint, swapEvent) => {
      // get poolId from swap event
      const { id } = swapEvent.args;

      // check if poolId has hooks
      const query = db.query(`SELECT hooks FROM PoolIdMap WHERE id = $poolId;`);
      let record = query.get({ $poolId: id });
      if (record === null) record = { hooks: zeroAddress };

      return (record as { hooks: Address }).hooks === zeroAddress
        ? gasUsedToRebate
        : gasUsedToRebate + rebatePerSwap + rebatePerHook;
    },
    0n
  );

  gasUsedToRebate =
    txnReceipt.gasUsed < gasUsedToRebate
      ? (txnReceipt.gasUsed * 90n) / 100n // rebate a max of 90% of gasUsed
      : gasUsedToRebate;

  return { beneficiary, gasToRebate: gasUsedToRebate * gasPrice };
}

async function getRebatePerEvent(
  client: PublicClient
): Promise<{ rebatePerSwap: bigint; rebatePerHook: bigint }> {
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
  return { rebatePerSwap, rebatePerHook };
}
