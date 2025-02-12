import { ponder } from "ponder:registry";
import schema from "ponder:schema";

ponder.on("PoolManager:Initialize", async ({ event, context }) => {
  await context.db.insert(schema.pool).values({
    poolId: event.args.id,
    currency0: event.args.currency0,
    currency1: event.args.currency1,
    fee: event.args.fee,
    tickSpacing: event.args.tickSpacing,
    hooks: event.args.hooks,
    chainId: context.network.chainId,
  });
});
