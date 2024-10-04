import { ponder } from "@/generated";

ponder.on("PoolManager:Initialize", async ({ event, context }) => {
    const { PoolIdMap } = context.db;
   
    await PoolIdMap.create({
      id: event.args.id,
      data: {
        currency0: event.args.currency0,
        currency1: event.args.currency1,
        fee: event.args.fee,
        tickSpacing: event.args.tickSpacing,
        hooks: event.args.hooks,
      },
    });
  });