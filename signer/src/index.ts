import { ponder } from "ponder:registry";
import schema from "ponder:schema";
import { zeroAddress } from "viem";

ponder.on("PoolManager:Initialize", async ({ event, context }) => {
  if (event.args.hooks !== zeroAddress) {
    await context.db.insert(schema.pool).values({
      poolId: event.args.id,
      currency0: event.args.currency0,
      currency1: event.args.currency1,
      fee: event.args.fee,
      tickSpacing: event.args.tickSpacing,
      hooks: event.args.hooks,
      chainId: context.network.chainId,
    });
  }
});
