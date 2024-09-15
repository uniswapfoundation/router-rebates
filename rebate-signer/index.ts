import { createPublicClient, http } from "viem";
import { anvil } from "viem/chains";
import { calculateRebate } from "./src/rebate";
import { sign } from "./src/signer";

const publicClient = createPublicClient({
  chain: anvil, // TODO: Use the correct chain
  transport: http(),
});

Bun.serve({
  async fetch(req) {
    const txnHash =
      "0x8f42d0925429ef3163da00ebdca7c425d4d74a5dc117948d8f3755edcb848f32" as `0x${string}`;
    const { referrer, gasToRebate } = await calculateRebate(
      publicClient,
      txnHash
    );
    const signature = await sign(referrer, txnHash, gasToRebate);
    return new Response(signature);
  },
});
