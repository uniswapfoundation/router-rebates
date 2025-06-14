import { db } from "ponder:api";
import schema from "ponder:schema";
import { Hono } from "hono";
import { graphql } from "ponder";
import { batch } from "./util/main";
import { getClient } from "./util/chain";
import { rateLimiter } from "hono-rate-limiter";
import { getConnInfo as vercelConnInfo } from "hono/vercel";

const app = new Hono();

// Enable this if we want other microservices to access the database
// app.use("/sql/*", client({ db, schema }));

app.use("/", graphql({ db, schema }));
app.use("/graphql", graphql({ db, schema }));

// rate limit the test endpoint
app.use(
  "/test-ip",
  rateLimiter({
    windowMs: 60 * 1000, // 1 minute
    limit: 5,
    keyGenerator: (c) => vercelConnInfo(c).remote.address ?? c.req.query("beneficiary") ?? "defaultKey",
    message: "Too many requests exceeded per minute"
  })
);

app.use("/test-ip", async (c) => {
  const vercelInfo = vercelConnInfo(c);
  return c.text(vercelInfo.remote.address ?? "unknown");
})

// rate limit the sign endpoint
app.use(
  "/sign",
  rateLimiter({
    windowMs: 60 * 1000, // 1 minute
    limit: 50,
    keyGenerator: (c) => vercelConnInfo(c).remote.address ?? c.req.query("beneficiary") ?? "defaultKey",
    message: "Too many requests exceeded per minute"
  })
);

/// @notice the /sign endpoint takes chainId, list of transaction hashes, and the beneficiary address as query parameters
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

  const beneficiary = c.req.query("beneficiary");
  if (beneficiary === undefined) {
    return c.text(
      "provide beneficiary as query parameter, the address of the contract (in the Swap event): &beneficiary=0x123"
    );
  }

  try {
    const publicClient = getClient(Number(chainId));
    if (publicClient === undefined) {
      return c.text("Unsupported chainId provided");
    }

    const txnHashList = txnHashes.split(",") as `0x${string}`[];

    const result = await batch(
      publicClient,
      txnHashList,
      beneficiary as `0x${string}`
    );

    return c.json(result);
  } catch (e) {
    console.error(e);
    return c.text("Something went wrong");
  }
});

export default app;
