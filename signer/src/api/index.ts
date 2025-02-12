import { db } from "ponder:api";
import schema from "ponder:schema";
import { Hono } from "hono";
import { client, graphql } from "ponder";
import { batch } from "./util/main";
import { getClient } from "./util/chain";
import { createClient } from "@ponder/client";

const app = new Hono();

app.use("/sql/*", client({ db, schema }));

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

  const dbclient = createClient("http://localhost:42069/sql", { schema });
  const publicClient = getClient(Number(chainId));
  const txnHashList = txnHashes.split(",") as `0x${string}`[];

  await batch(dbclient, publicClient, txnHashList);

  return c.text("HELLO WORLD");
});

export default app;
