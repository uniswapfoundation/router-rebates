import { createSchema } from "@ponder/core";

export default createSchema((p) => ({
  PoolIdMap: p.createTable({
    id: p.string(),
    currency0: p.string(),
    currency1: p.string(),
    fee: p.int(),
    tickSpacing: p.int(),
    hooks: p.string(),
  }),
}));
