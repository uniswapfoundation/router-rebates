import { createPublicClient, http } from "viem";
import { anvil } from "viem/chains";
import { calculateRebate } from "./src/rebate";

const publicClient = createPublicClient({
  chain: anvil, // TODO: Use the correct chain
  transport: http(),
});

Bun.serve({
  fetch(req) {
    calculateRebate(publicClient, "0x0" as `0x${string}`);
    return new Response("Bun!");
  },
});
