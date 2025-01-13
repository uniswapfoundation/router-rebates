import { Database } from "bun:sqlite";
import { createPublicClient, http } from "viem";
import { anvil } from "viem/chains";
import { batch } from "./src/main";

const publicClient = createPublicClient({
  chain: anvil, // TODO: Use the correct chain
  transport: http(),
});

const db = new Database("../poolid-indexer/.ponder/sqlite/public.db", {
  readonly: true,
});

Bun.serve({
  async fetch(req) {
    const url = new URL(req.url);
    const paths = url.pathname.split("/");

    if (paths.length == 2 && paths[1] == "sign") {
      const txnHashes = url.searchParams
        .get("txnHashes")
        ?.split(",") as `0x${string}`[];

      return Response.json(await batch(db, publicClient, txnHashes));
    } else {
      // TODO: proper 404?
      return new Response(
        "Invalid URL. Must be /sign?chainId=1&campaignId=1&txnHashes=0x123,0x456"
      );
    }
  },
});
