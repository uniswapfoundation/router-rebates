//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// PoolManager
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x000000000004444c5dc75cb358380d2e3de08a90)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x9a13f98cb987694c9f086b1f5eb990eea8264ec3)
 * - [__View Contract on Unichain Uniscan__](https://uniscan.xyz/address/0x1f98400000000000000000000000000000000004)
 * - [__View Contract on World Chain Worldscan__](https://worldscan.org/address/0xb1860d529182ac3bc1f51fa2abd56662b7d13f33)
 * - [__View Contract on Unichain Sepolia Uniscan__](https://sepolia.uniscan.xyz/address/0x00B036B58a818B1BC34d502D3fE730Db729e62AC)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x498581ff718922c3f8e6a244956af099b2652b2b)
 * - [__View Contract on Arbitrum One Arbiscan__](https://arbiscan.io/address/0x360e68faccca8ca495c1b759fd9eee466db9fb32)
 * - [__View Contract on Blast Blastscan__](https://blastscan.io/address/0x1631559198a9e474033433b2958dabc135ab6446)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408)
 * - [__View Contract on Arbitrum Sepolia Arbiscan__](https://sepolia.arbiscan.io/address/0xFB3e0C6F74eB1a21CC1Da29aeC80D2Dfe6C9a317)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xE03A1074c86CFeDd5C142C4F04F1a1536e203543)
 */
export const poolManagerAbi = [
  {
    type: "constructor",
    inputs: [
      { name: "initialOwner", internalType: "address", type: "address" },
    ],
    stateMutability: "nonpayable",
  },
  { type: "error", inputs: [], name: "AlreadyUnlocked" },
  {
    type: "error",
    inputs: [
      { name: "currency0", internalType: "address", type: "address" },
      { name: "currency1", internalType: "address", type: "address" },
    ],
    name: "CurrenciesOutOfOrderOrEqual",
  },
  { type: "error", inputs: [], name: "CurrencyNotSettled" },
  { type: "error", inputs: [], name: "DelegateCallNotAllowed" },
  { type: "error", inputs: [], name: "InvalidCaller" },
  { type: "error", inputs: [], name: "ManagerLocked" },
  { type: "error", inputs: [], name: "MustClearExactPositiveDelta" },
  { type: "error", inputs: [], name: "NonzeroNativeValue" },
  { type: "error", inputs: [], name: "PoolNotInitialized" },
  { type: "error", inputs: [], name: "ProtocolFeeCurrencySynced" },
  {
    type: "error",
    inputs: [{ name: "fee", internalType: "uint24", type: "uint24" }],
    name: "ProtocolFeeTooLarge",
  },
  { type: "error", inputs: [], name: "SwapAmountCannotBeZero" },
  {
    type: "error",
    inputs: [{ name: "tickSpacing", internalType: "int24", type: "int24" }],
    name: "TickSpacingTooLarge",
  },
  {
    type: "error",
    inputs: [{ name: "tickSpacing", internalType: "int24", type: "int24" }],
    name: "TickSpacingTooSmall",
  },
  { type: "error", inputs: [], name: "UnauthorizedDynamicLPFeeUpdate" },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "owner",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "spender",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      { name: "id", internalType: "uint256", type: "uint256", indexed: true },
      {
        name: "amount",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
    ],
    name: "Approval",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      { name: "id", internalType: "PoolId", type: "bytes32", indexed: true },
      {
        name: "sender",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "amount0",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
      {
        name: "amount1",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
    ],
    name: "Donate",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      { name: "id", internalType: "PoolId", type: "bytes32", indexed: true },
      {
        name: "currency0",
        internalType: "Currency",
        type: "address",
        indexed: true,
      },
      {
        name: "currency1",
        internalType: "Currency",
        type: "address",
        indexed: true,
      },
      { name: "fee", internalType: "uint24", type: "uint24", indexed: false },
      {
        name: "tickSpacing",
        internalType: "int24",
        type: "int24",
        indexed: false,
      },
      {
        name: "hooks",
        internalType: "contract IHooks",
        type: "address",
        indexed: false,
      },
      {
        name: "sqrtPriceX96",
        internalType: "uint160",
        type: "uint160",
        indexed: false,
      },
      { name: "tick", internalType: "int24", type: "int24", indexed: false },
    ],
    name: "Initialize",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      { name: "id", internalType: "PoolId", type: "bytes32", indexed: true },
      {
        name: "sender",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "tickLower",
        internalType: "int24",
        type: "int24",
        indexed: false,
      },
      {
        name: "tickUpper",
        internalType: "int24",
        type: "int24",
        indexed: false,
      },
      {
        name: "liquidityDelta",
        internalType: "int256",
        type: "int256",
        indexed: false,
      },
      {
        name: "salt",
        internalType: "bytes32",
        type: "bytes32",
        indexed: false,
      },
    ],
    name: "ModifyLiquidity",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "owner",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "operator",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      { name: "approved", internalType: "bool", type: "bool", indexed: false },
    ],
    name: "OperatorSet",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      { name: "user", internalType: "address", type: "address", indexed: true },
      {
        name: "newOwner",
        internalType: "address",
        type: "address",
        indexed: true,
      },
    ],
    name: "OwnershipTransferred",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "protocolFeeController",
        internalType: "address",
        type: "address",
        indexed: true,
      },
    ],
    name: "ProtocolFeeControllerUpdated",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      { name: "id", internalType: "PoolId", type: "bytes32", indexed: true },
      {
        name: "protocolFee",
        internalType: "uint24",
        type: "uint24",
        indexed: false,
      },
    ],
    name: "ProtocolFeeUpdated",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      { name: "id", internalType: "PoolId", type: "bytes32", indexed: true },
      {
        name: "sender",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "amount0",
        internalType: "int128",
        type: "int128",
        indexed: false,
      },
      {
        name: "amount1",
        internalType: "int128",
        type: "int128",
        indexed: false,
      },
      {
        name: "sqrtPriceX96",
        internalType: "uint160",
        type: "uint160",
        indexed: false,
      },
      {
        name: "liquidity",
        internalType: "uint128",
        type: "uint128",
        indexed: false,
      },
      { name: "tick", internalType: "int24", type: "int24", indexed: false },
      { name: "fee", internalType: "uint24", type: "uint24", indexed: false },
    ],
    name: "Swap",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "caller",
        internalType: "address",
        type: "address",
        indexed: false,
      },
      { name: "from", internalType: "address", type: "address", indexed: true },
      { name: "to", internalType: "address", type: "address", indexed: true },
      { name: "id", internalType: "uint256", type: "uint256", indexed: true },
      {
        name: "amount",
        internalType: "uint256",
        type: "uint256",
        indexed: false,
      },
    ],
    name: "Transfer",
  },
  {
    type: "function",
    inputs: [
      { name: "owner", internalType: "address", type: "address" },
      { name: "spender", internalType: "address", type: "address" },
      { name: "id", internalType: "uint256", type: "uint256" },
    ],
    name: "allowance",
    outputs: [{ name: "amount", internalType: "uint256", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [
      { name: "spender", internalType: "address", type: "address" },
      { name: "id", internalType: "uint256", type: "uint256" },
      { name: "amount", internalType: "uint256", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [
      { name: "owner", internalType: "address", type: "address" },
      { name: "id", internalType: "uint256", type: "uint256" },
    ],
    name: "balanceOf",
    outputs: [{ name: "balance", internalType: "uint256", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [
      { name: "from", internalType: "address", type: "address" },
      { name: "id", internalType: "uint256", type: "uint256" },
      { name: "amount", internalType: "uint256", type: "uint256" },
    ],
    name: "burn",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [
      { name: "currency", internalType: "Currency", type: "address" },
      { name: "amount", internalType: "uint256", type: "uint256" },
    ],
    name: "clear",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [
      { name: "recipient", internalType: "address", type: "address" },
      { name: "currency", internalType: "Currency", type: "address" },
      { name: "amount", internalType: "uint256", type: "uint256" },
    ],
    name: "collectProtocolFees",
    outputs: [
      { name: "amountCollected", internalType: "uint256", type: "uint256" },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [
      {
        name: "key",
        internalType: "struct PoolKey",
        type: "tuple",
        components: [
          { name: "currency0", internalType: "Currency", type: "address" },
          { name: "currency1", internalType: "Currency", type: "address" },
          { name: "fee", internalType: "uint24", type: "uint24" },
          { name: "tickSpacing", internalType: "int24", type: "int24" },
          { name: "hooks", internalType: "contract IHooks", type: "address" },
        ],
      },
      { name: "amount0", internalType: "uint256", type: "uint256" },
      { name: "amount1", internalType: "uint256", type: "uint256" },
      { name: "hookData", internalType: "bytes", type: "bytes" },
    ],
    name: "donate",
    outputs: [{ name: "delta", internalType: "BalanceDelta", type: "int256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [{ name: "slot", internalType: "bytes32", type: "bytes32" }],
    name: "extsload",
    outputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [
      { name: "startSlot", internalType: "bytes32", type: "bytes32" },
      { name: "nSlots", internalType: "uint256", type: "uint256" },
    ],
    name: "extsload",
    outputs: [{ name: "", internalType: "bytes32[]", type: "bytes32[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [{ name: "slots", internalType: "bytes32[]", type: "bytes32[]" }],
    name: "extsload",
    outputs: [{ name: "", internalType: "bytes32[]", type: "bytes32[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [{ name: "slots", internalType: "bytes32[]", type: "bytes32[]" }],
    name: "exttload",
    outputs: [{ name: "", internalType: "bytes32[]", type: "bytes32[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [{ name: "slot", internalType: "bytes32", type: "bytes32" }],
    name: "exttload",
    outputs: [{ name: "", internalType: "bytes32", type: "bytes32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [
      {
        name: "key",
        internalType: "struct PoolKey",
        type: "tuple",
        components: [
          { name: "currency0", internalType: "Currency", type: "address" },
          { name: "currency1", internalType: "Currency", type: "address" },
          { name: "fee", internalType: "uint24", type: "uint24" },
          { name: "tickSpacing", internalType: "int24", type: "int24" },
          { name: "hooks", internalType: "contract IHooks", type: "address" },
        ],
      },
      { name: "sqrtPriceX96", internalType: "uint160", type: "uint160" },
    ],
    name: "initialize",
    outputs: [{ name: "tick", internalType: "int24", type: "int24" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [
      { name: "owner", internalType: "address", type: "address" },
      { name: "operator", internalType: "address", type: "address" },
    ],
    name: "isOperator",
    outputs: [{ name: "isOperator", internalType: "bool", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [
      { name: "to", internalType: "address", type: "address" },
      { name: "id", internalType: "uint256", type: "uint256" },
      { name: "amount", internalType: "uint256", type: "uint256" },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [
      {
        name: "key",
        internalType: "struct PoolKey",
        type: "tuple",
        components: [
          { name: "currency0", internalType: "Currency", type: "address" },
          { name: "currency1", internalType: "Currency", type: "address" },
          { name: "fee", internalType: "uint24", type: "uint24" },
          { name: "tickSpacing", internalType: "int24", type: "int24" },
          { name: "hooks", internalType: "contract IHooks", type: "address" },
        ],
      },
      {
        name: "params",
        internalType: "struct IPoolManager.ModifyLiquidityParams",
        type: "tuple",
        components: [
          { name: "tickLower", internalType: "int24", type: "int24" },
          { name: "tickUpper", internalType: "int24", type: "int24" },
          { name: "liquidityDelta", internalType: "int256", type: "int256" },
          { name: "salt", internalType: "bytes32", type: "bytes32" },
        ],
      },
      { name: "hookData", internalType: "bytes", type: "bytes" },
    ],
    name: "modifyLiquidity",
    outputs: [
      { name: "callerDelta", internalType: "BalanceDelta", type: "int256" },
      { name: "feesAccrued", internalType: "BalanceDelta", type: "int256" },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [],
    name: "owner",
    outputs: [{ name: "", internalType: "address", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [],
    name: "protocolFeeController",
    outputs: [{ name: "", internalType: "address", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [{ name: "currency", internalType: "Currency", type: "address" }],
    name: "protocolFeesAccrued",
    outputs: [{ name: "amount", internalType: "uint256", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [
      { name: "operator", internalType: "address", type: "address" },
      { name: "approved", internalType: "bool", type: "bool" },
    ],
    name: "setOperator",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [
      {
        name: "key",
        internalType: "struct PoolKey",
        type: "tuple",
        components: [
          { name: "currency0", internalType: "Currency", type: "address" },
          { name: "currency1", internalType: "Currency", type: "address" },
          { name: "fee", internalType: "uint24", type: "uint24" },
          { name: "tickSpacing", internalType: "int24", type: "int24" },
          { name: "hooks", internalType: "contract IHooks", type: "address" },
        ],
      },
      { name: "newProtocolFee", internalType: "uint24", type: "uint24" },
    ],
    name: "setProtocolFee",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [{ name: "controller", internalType: "address", type: "address" }],
    name: "setProtocolFeeController",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [],
    name: "settle",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "payable",
  },
  {
    type: "function",
    inputs: [{ name: "recipient", internalType: "address", type: "address" }],
    name: "settleFor",
    outputs: [{ name: "", internalType: "uint256", type: "uint256" }],
    stateMutability: "payable",
  },
  {
    type: "function",
    inputs: [{ name: "interfaceId", internalType: "bytes4", type: "bytes4" }],
    name: "supportsInterface",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    inputs: [
      {
        name: "key",
        internalType: "struct PoolKey",
        type: "tuple",
        components: [
          { name: "currency0", internalType: "Currency", type: "address" },
          { name: "currency1", internalType: "Currency", type: "address" },
          { name: "fee", internalType: "uint24", type: "uint24" },
          { name: "tickSpacing", internalType: "int24", type: "int24" },
          { name: "hooks", internalType: "contract IHooks", type: "address" },
        ],
      },
      {
        name: "params",
        internalType: "struct IPoolManager.SwapParams",
        type: "tuple",
        components: [
          { name: "zeroForOne", internalType: "bool", type: "bool" },
          { name: "amountSpecified", internalType: "int256", type: "int256" },
          {
            name: "sqrtPriceLimitX96",
            internalType: "uint160",
            type: "uint160",
          },
        ],
      },
      { name: "hookData", internalType: "bytes", type: "bytes" },
    ],
    name: "swap",
    outputs: [
      { name: "swapDelta", internalType: "BalanceDelta", type: "int256" },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [{ name: "currency", internalType: "Currency", type: "address" }],
    name: "sync",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [
      { name: "currency", internalType: "Currency", type: "address" },
      { name: "to", internalType: "address", type: "address" },
      { name: "amount", internalType: "uint256", type: "uint256" },
    ],
    name: "take",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [
      { name: "receiver", internalType: "address", type: "address" },
      { name: "id", internalType: "uint256", type: "uint256" },
      { name: "amount", internalType: "uint256", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [
      { name: "sender", internalType: "address", type: "address" },
      { name: "receiver", internalType: "address", type: "address" },
      { name: "id", internalType: "uint256", type: "uint256" },
      { name: "amount", internalType: "uint256", type: "uint256" },
    ],
    name: "transferFrom",
    outputs: [{ name: "", internalType: "bool", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [{ name: "newOwner", internalType: "address", type: "address" }],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [{ name: "data", internalType: "bytes", type: "bytes" }],
    name: "unlock",
    outputs: [{ name: "result", internalType: "bytes", type: "bytes" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    inputs: [
      {
        name: "key",
        internalType: "struct PoolKey",
        type: "tuple",
        components: [
          { name: "currency0", internalType: "Currency", type: "address" },
          { name: "currency1", internalType: "Currency", type: "address" },
          { name: "fee", internalType: "uint24", type: "uint24" },
          { name: "tickSpacing", internalType: "int24", type: "int24" },
          { name: "hooks", internalType: "contract IHooks", type: "address" },
        ],
      },
      { name: "newDynamicLPFee", internalType: "uint24", type: "uint24" },
    ],
    name: "updateDynamicLPFee",
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x000000000004444c5dc75cb358380d2e3de08a90)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x9a13f98cb987694c9f086b1f5eb990eea8264ec3)
 * - [__View Contract on Unichain Uniscan__](https://uniscan.xyz/address/0x1f98400000000000000000000000000000000004)
 * - [__View Contract on World Chain Worldscan__](https://worldscan.org/address/0xb1860d529182ac3bc1f51fa2abd56662b7d13f33)
 * - [__View Contract on Unichain Sepolia Uniscan__](https://sepolia.uniscan.xyz/address/0x00B036B58a818B1BC34d502D3fE730Db729e62AC)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x498581ff718922c3f8e6a244956af099b2652b2b)
 * - [__View Contract on Arbitrum One Arbiscan__](https://arbiscan.io/address/0x360e68faccca8ca495c1b759fd9eee466db9fb32)
 * - [__View Contract on Blast Blastscan__](https://blastscan.io/address/0x1631559198a9e474033433b2958dabc135ab6446)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408)
 * - [__View Contract on Arbitrum Sepolia Arbiscan__](https://sepolia.arbiscan.io/address/0xFB3e0C6F74eB1a21CC1Da29aeC80D2Dfe6C9a317)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xE03A1074c86CFeDd5C142C4F04F1a1536e203543)
 */
export const poolManagerAddress = {
  1: "0x000000000004444c5dc75cB358380D2e3dE08A90",
  10: "0x9a13F98Cb987694C9F086b1F5eB990EeA8264Ec3",
  130: "0x1F98400000000000000000000000000000000004",
  480: "0xb1860D529182ac3BC1F51Fa2ABd56662b7D13f33",
  1301: "0x00B036B58a818B1BC34d502D3fE730Db729e62AC",
  8453: "0x498581fF718922c3f8e6A244956aF099B2652b2b",
  42161: "0x360E68faCcca8cA495c1B759Fd9EEe466db9FB32",
  81457: "0x1631559198A9e474033433b2958daBC135ab6446",
  84532: "0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408",
  421614: "0xFB3e0C6F74eB1a21CC1Da29aeC80D2Dfe6C9a317",
  11155111: "0xE03A1074c86CFeDd5C142C4F04F1a1536e203543",
} as const;

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x000000000004444c5dc75cb358380d2e3de08a90)
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x9a13f98cb987694c9f086b1f5eb990eea8264ec3)
 * - [__View Contract on Unichain Uniscan__](https://uniscan.xyz/address/0x1f98400000000000000000000000000000000004)
 * - [__View Contract on World Chain Worldscan__](https://worldscan.org/address/0xb1860d529182ac3bc1f51fa2abd56662b7d13f33)
 * - [__View Contract on Unichain Sepolia Uniscan__](https://sepolia.uniscan.xyz/address/0x00B036B58a818B1BC34d502D3fE730Db729e62AC)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x498581ff718922c3f8e6a244956af099b2652b2b)
 * - [__View Contract on Arbitrum One Arbiscan__](https://arbiscan.io/address/0x360e68faccca8ca495c1b759fd9eee466db9fb32)
 * - [__View Contract on Blast Blastscan__](https://blastscan.io/address/0x1631559198a9e474033433b2958dabc135ab6446)
 * - [__View Contract on Base Sepolia Basescan__](https://sepolia.basescan.org/address/0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408)
 * - [__View Contract on Arbitrum Sepolia Arbiscan__](https://sepolia.arbiscan.io/address/0xFB3e0C6F74eB1a21CC1Da29aeC80D2Dfe6C9a317)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xE03A1074c86CFeDd5C142C4F04F1a1536e203543)
 */
export const poolManagerConfig = {
  address: poolManagerAddress,
  abi: poolManagerAbi,
} as const;
