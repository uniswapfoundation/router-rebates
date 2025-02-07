import { createConfig } from "@ponder/core";
import { http } from "viem";

import { abi as PoolManagerAbi } from "../../foundry-contracts/out/PoolManager.sol/PoolManager.json";
import { transactions } from "../../foundry-contracts/broadcast/Anvil.s.sol/31337/run-latest.json";

export default createConfig({
  networks: {
    anvil: {
      chainId: 31337,
      transport: http(process.env.PONDER_RPC_URL_31337),
    },
    sepolia: {
      chainId: 11155111,
      transport: http(process.env.PONDER_RPC_URL_11155111),
    },
  },
  contracts: {
    PoolManager: {
      network: {
        anvil: {
          address: transactions.find(
            (tx) =>
              tx.transactionType === "CREATE" &&
              tx.contractName === "PoolManager"
          )?.contractAddress as `0x${string}`,
          startBlock: 0,
        },
        sepolia: {
          address:
            "0xE03A1074c86CFeDd5C142C4F04F1a1536e203543" as `0x${string}`,
          startBlock: 7258946,
        },
      },
      abi: PoolManagerAbi as any,
    },
  },
});
