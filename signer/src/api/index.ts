import { db } from "ponder:api";
import schema from "ponder:schema";
import { Hono } from "hono";
import { graphql } from "ponder";
import { batch } from "./util/main";
import { getClient } from "./util/chain";

const app = new Hono();

// Enable this if we want other microservices to access the database
// app.use("/sql/*", client({ db, schema }));

app.use("/", graphql({ db, schema }));
app.use("/graphql", graphql({ db, schema }));

app.get("/sign", async (c) => {
  const chainId = c.req.query("chainId");
  if (chainId === undefined) {
    return c.text("provide chainId as query parameter: ?chainId=1");
  }
  const txnHashes = c.req.query("txnHashes");
  if (txnHashes === undefined) {
    return c.text(
      "provide txnHashes as query parameter: &txnHashes=0x123,0x456"
    );
  }

  const publicClient = getClient(Number(chainId));
  let txnHashList = txnHashes.split(",") as `0x${string}`[];

  // deduplicate txn hashes
  txnHashList = [...new Set(txnHashList)];

  const result = await batch(publicClient, txnHashList);

  return c.json(result);
});

export default app;
