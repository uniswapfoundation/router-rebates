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
        ethereum_sepolia: {
          address: "0xE03A1074c86CFeDd5C142C4F04F1a1536e203543",
          startBlock: process.env.NODE_ENV === "dev" ? "latest" : 7258946,
        },
        unichain_sepolia: {
          address: "0x00B036B58a818B1BC34d502D3fE730Db729e62AC",
          startBlock: process.env.NODE_ENV === "dev" ? "latest" : 7092034,
        },
        base_sepolia: {
          address: "0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408",
          startBlock: process.env.NODE_ENV === "dev" ? "latest" : 19088197,
        },
        arbitrum_sepolia: {
          address: "0xFB3e0C6F74eB1a21CC1Da29aeC80D2Dfe6C9a317",
          startBlock: process.env.NODE_ENV === "dev" ? "latest" : 105909222,
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
