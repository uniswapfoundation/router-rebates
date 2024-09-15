import { createPublicClient, http } from "viem";
import { anvil } from "viem/chains";
import { calculateRebate } from "./src/rebate";

const publicClient = createPublicClient({
  chain: anvil, // TODO: Use the correct chain
  transport: http(),
});

Bun.serve({
  async fetch(req) {
    const txnHash =
      "0x7126b7a4cd438c366824350d5334baac1f2dd4f9c71382629955b03ef1829495" as `0x${string}`;
    const gasToRebate = await calculateRebate(publicClient, txnHash);
    return new Response(String(gasToRebate));
  },
});
