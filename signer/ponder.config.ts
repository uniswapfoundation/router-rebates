import { createConfig } from "ponder";
import { http } from "viem";

import { PoolManagerAbi } from "./abis/PoolManagerAbi";

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
    arbitrum: {
      chainId: 42161,
      transport: http(process.env.PONDER_RPC_URL_42161),
      maxRequestsPerSecond: process.env.PONDER_RPC_URL_42161 !== "" ? 15 : 5,
    },
    optimism: {
      chainId: 10,
      transport: http(process.env.PONDER_RPC_URL_10),
      maxRequestsPerSecond: process.env.PONDER_RPC_URL_10 !== "" ? 15 : 5,
    },
    base: {
      chainId: 8453,
      transport: http(process.env.PONDER_RPC_URL_8453),
      maxRequestsPerSecond: process.env.PONDER_RPC_URL_8453 !== "" ? 15 : 5,
    },
    polygon: {
      chainId: 137,
      transport: http(process.env.PONDER_RPC_URL_137),
      maxRequestsPerSecond: process.env.PONDER_RPC_URL_137 !== "" ? 15 : 5,
    },
    worldchain: {
      chainId: 480,
      transport: http(process.env.PONDER_RPC_URL_480),
      maxRequestsPerSecond: process.env.PONDER_RPC_URL_480 !== "" ? 15 : 5,
    },
    blast: {
      chainId: 81457,
      transport: http(process.env.PONDER_RPC_URL_81457),
      maxRequestsPerSecond: process.env.PONDER_RPC_URL_81457 !== "" ? 15 : 5,
    },
  },
  contracts: {
    PoolManager: {
      network: {
        mainnet: {
          address: "0x000000000004444c5dc75cb358380d2e3de08a90",
          startBlock: process.env.NODE_ENV === "dev" ? "latest" : 21688329,
        },
        unichain: {
          address: "0x1f98400000000000000000000000000000000004",
          startBlock: process.env.NODE_ENV === "dev" ? "latest" : 0,
        },
        arbitrum: {
          address: "0x360e68faccca8ca495c1b759fd9eee466db9fb32",
          startBlock: process.env.NODE_ENV === "dev" ? "latest" : 297842872,
        },
        optimism: {
          address: "0x9a13f98cb987694c9f086b1f5eb990eea8264ec3",
          startBlock: process.env.NODE_ENV === "dev" ? "latest" : 130947675,
        },
        base: {
          address: "0x498581ff718922c3f8e6a244956af099b2652b2b",
          startBlock: process.env.NODE_ENV === "dev" ? "latest" : 25350988,
        },
        polygon: {
          address: "0x67366782805870060151383f4bbff9dab53e5cd6",
          startBlock: process.env.NODE_ENV === "dev" ? "latest" : 66980384,
        },
        worldchain: {
          address: "0xb1860d529182ac3bc1f51fa2abd56662b7d13f33",
          startBlock: process.env.NODE_ENV === "dev" ? "latest" : 9111872,
        },
        blast: {
          address: "0x1631559198a9e474033433b2958dabc135ab6446",
          startBlock: process.env.NODE_ENV === "dev" ? "latest" : 14377311,
        },
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
