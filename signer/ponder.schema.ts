import { index, onchainTable } from "ponder";

export const pool = onchainTable(
  "poolKey",
  (t) => ({
    poolId: t.hex().notNull().primaryKey(),
    currency0: t.hex().notNull(),
    currency1: t.hex().notNull(),
    fee: t.integer().notNull(),
    tickSpacing: t.integer().notNull(),
    hooks: t.hex().notNull(),
    chainId: t.integer().notNull(),
  }),
  (table) => ({
    poolIdIndex: index().on(table.poolId),
    chainIdIndex: index().on(table.chainId),
  })
);
