import { createConfig } from "ponder";
import { http } from "viem";

import { PoolManagerAbi } from "./abis/PoolManagerAbi";
import { poolManagerAddress } from "./src/generated";

export default createConfig({
  ordering: "multichain",
  networks: {
    mainnet: {
      chainId: 1,
      transport: http(process.env.PONDER_RPC_URL_1),
      maxRequestsPerSecond: process.env.PONDER_RPC_URL_1 !== "" ? 15 : 5,
    },
    unichain: {
      chainId: 130,
      transport: http(process.env.PONDER_RPC_URL_130),
      maxRequestsPerSecond: process.env.PONDER_RPC_URL_130 !== "" ? 15 : 5,
    },
    ethereum_sepolia: {
      chainId: 11155111,
      transport: http(process.env.PONDER_RPC_URL_11155111),
      maxRequestsPerSecond: process.env.PONDER_RPC_URL_11155111 !== "" ? 15 : 5,
    },
    unichain_sepolia: {
      chainId: 1301,
      transport: http(process.env.PONDER_RPC_URL_1301),
      maxRequestsPerSecond: process.env.PONDER_RPC_URL_1301 !== "" ? 15 : 5,
    },
    base_sepolia: {
      chainId: 84532,
      transport: http(process.env.PONDER_RPC_URL_84532),
      maxRequestsPerSecond: process.env.PONDER_RPC_URL_84532 !== "" ? 15 : 5,
    },
    arbitrum_sepolia: {
      chainId: 421614,
      transport: http(process.env.PONDER_RPC_URL_421614),
      maxRequestsPerSecond: process.env.PONDER_RPC_URL_421614 !== "" ? 15 : 5,
    },
    ...(process.env.NODE_ENV === "dev" && {
      anvil: {
        chainId: 31337,
        transport: http("http://127.0.0.1:8545"),
      },
    }),
  },
  contracts: {
    PoolManager: {
      network: {
        mainnet: {
          address: poolManagerAddress[1],
          startBlock: process.env.NODE_ENV === "dev" ? "latest" : 21688329,
        },
        unichain: {
          address: poolManagerAddress[130],
          startBlock: process.env.NODE_ENV === "dev" ? "latest" : 0,
        },
        ethereum_sepolia: {
          address: poolManagerAddress[11155111],
          startBlock: process.env.NODE_ENV === "dev" ? "latest" : 7258946,
        },
        unichain_sepolia: {
          address: poolManagerAddress[1301],
          startBlock: process.env.NODE_ENV === "dev" ? "latest" : 7092034,
        },
        base_sepolia: {
          address: poolManagerAddress[84532],
          startBlock: process.env.NODE_ENV === "dev" ? "latest" : 19088197,
        },
        arbitrum_sepolia: {
          address: poolManagerAddress[421614],
          startBlock: process.env.NODE_ENV === "dev" ? "latest" : 105909222,
        },
        ...(process.env.NODE_ENV === "dev" && {
          anvil: {
            address: process.env.ANVIL_POOL_MANAGER_ADDRESS as `0x${string}`,
          },
        }),
      },
      abi: PoolManagerAbi,
      filter: [
        {
          event: "Initialize",
          args: {},
        },
      ],
    },
  },
});
