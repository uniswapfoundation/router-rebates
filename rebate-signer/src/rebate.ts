import { Database } from "bun:sqlite";
import {
  parseAbi,
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
  campaignId: bigint,
  txnHash: `0x${string}`
): Promise<{ referrer: Address; gasToRebate: bigint }> {
  const campaign = await getCampaign(
    process.env.REBATE_ADDRESS as `0x${string}`,
    campaignId
  );
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

  // TODO: handle txnHashes without swap event

  const referrer: Address = swapEvents[0].args.sender;

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
      const record = query.get({ $poolId: id }) as { hooks: Address };
      const hooks =
        record.hooks ?? "0x0000000000000000000000000000000000000000";

      return hooks === zeroAddress
        ? gasUsedToRebate
        : gasUsedToRebate + campaign.gasPerSwap + campaign.maxGasPerHook;
    },
    0n
  );

  gasUsedToRebate =
    txnReceipt.gasUsed < gasUsedToRebate
      ? (txnReceipt.gasUsed * 90n) / 100n // rebate a max of 90% of gasUsed
      : gasUsedToRebate;

  return { referrer, gasToRebate: gasUsedToRebate * gasPrice };
}
