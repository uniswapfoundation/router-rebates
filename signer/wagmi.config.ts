import { defineConfig } from "@wagmi/cli";
import { etherscan } from "@wagmi/cli/plugins";
import {
  arbitrum,
  arbitrumSepolia,
  base,
  baseSepolia,
  blast,
  mainnet,
  optimism,
  polygon,
  sepolia,
  unichain,
  unichainSepolia,
  worldchain,
} from "viem/chains";

export default defineConfig({
  out: "src/generated.ts",
  contracts: [],
  plugins: [
    etherscan({
      apiKey: process.env.ETHERSCAN_API_KEY!,
      chainId: mainnet.id,
      contracts: [
        {
          name: "PoolManager",
          address: {
            [mainnet.id]: "0x000000000004444c5dc75cb358380d2e3de08a90",
            [unichain.id]: "0x1f98400000000000000000000000000000000004",
            [arbitrum.id]: "0x360e68faccca8ca495c1b759fd9eee466db9fb32",
            [optimism.id]: "0x9a13f98cb987694c9f086b1f5eb990eea8264ec3",
            [base.id]: "0x498581ff718922c3f8e6a244956af099b2652b2b",
            [polygon.id]: "0x67366782805870060151383f4bbff9dab53e5cd6",
            [worldchain.id]: "0xb1860d529182ac3bc1f51fa2abd56662b7d13f33",
            [blast.id]: "0x1631559198a9e474033433b2958dabc135ab6446",
            [sepolia.id]: "0xE03A1074c86CFeDd5C142C4F04F1a1536e203543",
            [unichainSepolia.id]: "0x00B036B58a818B1BC34d502D3fE730Db729e62AC",
            [baseSepolia.id]: "0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408",
            [arbitrumSepolia.id]: "0xFB3e0C6F74eB1a21CC1Da29aeC80D2Dfe6C9a317",
          },
        },
      ],
    }),
  ],
});
