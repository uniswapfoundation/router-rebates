import { createConfig } from "@ponder/core";
import { http } from "viem";

import { abi as PoolManagerAbi } from "../out/PoolManager.sol/PoolManager.json";
import { transactions } from "../broadcast/Anvil.s.sol/31337/run-latest.json";

export default createConfig({
  networks: {
    anvil: {
      chainId: 31337,
      transport: http(process.env.PONDER_RPC_URL_31337),
    },
  },
  contracts: {
    PoolManager: {
      network: "anvil",
      abi: PoolManagerAbi as any,
      address: transactions.find(
        (tx) =>
          tx.transactionType === "CREATE" && tx.contractName === "PoolManager"
      )?.contractAddress as `0x${string}`,
      startBlock: 0,
    },
  },
});
