import { createPublicClient, http } from "viem";
import { anvil } from "viem/chains";
import { batch, single } from "./src/main";

const publicClient = createPublicClient({
  chain: anvil, // TODO: Use the correct chain
  transport: http(),
});

Bun.serve({
  async fetch(req) {
    const url = new URL(req.url);
    const paths = url.pathname.split("/");

    if (paths.length == 2 && paths[1] == "sign") {
      const campaignId = BigInt(url.searchParams.get("campaignId")!);
      const txnHashes = url.searchParams
        .get("txnHashes")
        ?.split(",") as `0x${string}`[];

      return Response.json(await batch(publicClient, campaignId, txnHashes));
    }
    if (paths.length == 3) {
      const chainId = paths[1];
      const txnHash = paths[2] as `0x${string}`;
      if (chainId === "1") {
        return new Response("Not supported yet");
      } else if (chainId === "31337") {
        // TODO: remove/deprecate
        return Response.json(await single(publicClient, BigInt(0), txnHash));
      } else {
        return new Response("Invalid network");
      }
    } else {
      // TODO: proper 404?
      return new Response(
        "Invalid URL. Must be /<chaind_id>/<transaction_hash>"
      );
    }
  },
});
