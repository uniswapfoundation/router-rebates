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
    const gasToRebate = await calculateRebate(publicClient, txnHash);
    const signature = await sign(
      "0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0",
      txnHash,
      gasToRebate
    );
    return new Response(signature);
  },
});
