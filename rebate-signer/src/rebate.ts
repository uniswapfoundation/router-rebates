import {
  parseAbi,
  parseEventLogs,
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
  console.log(gasPrice);

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
  let gasToRebate = swapEvents.reduce((gasToRebate: bigint, swapEvent) => {
    // const { id } = swapEvent.args;
    // TODO: poolId => poolKey => hook

    return (
      gasToRebate +
      campaign.gasPerSwap * gasPrice +
      campaign.maxGasPerHook * gasPrice
    );
  }, 0n);
  gasToRebate =
    txnReceipt.gasUsed < gasToRebate ? txnReceipt.gasUsed : gasToRebate;
  console.log(gasPrice);
  console.log(gasToRebate);
  // swapEvents.forEach((swapEvent) => {
  //   // const { id } = swapEvent.args;
  //   // TODO: poolId => poolKey => hook

  //   gasToRebate +=
  //     campaign.gasPerSwap * gasPrice + campaign.maxGasPerHook * gasPrice;
  // });
  return { referrer, gasToRebate };
}
