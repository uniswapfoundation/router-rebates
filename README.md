## :construction: UNDER CONSTRUCTION :construction:

# Router Rebates

A gas subsidy program, sponsored by Uniswap Foundation and Brevis, to encourage routing and solving integration with Uniswap v4 Hooks

---

# Program Specs

For any transaction that touches a Uniswap v4 pool, _with a hook_, authors of the swap router (_`sender` address in the `Swap` event_), will be able to claim a rebate against the gas spent

Rebates will be available on the 12 initial chains with Uniswap v4, with claims faciliated on Unichain. The rebate is paid out in native Ether.

### Rebate Size

For a given transaction hash, with swap events coming from a hook'ed pool, the rebate is calculated according to:

```
gasUsageToRebate = 80,000 * number_of_swap_events + 80,000
ethToRebate = gasUsageToRebate * txnReceipt.baseFee
```

> As a safety precaution against hyper-optimized swaps, the minimum of the above calculation or _80% of transaction gas usage_ is taken

# Router Integrations

Because rebates are claimed on _Unichain_ for trades happening on other networks, _beneficiaries_ need to specify the authorized claimer.

The swap router contract (the contract calling `poolManager.swap()`) should implement this function selector:

```solidity
function rebateClaimer() external view returns (address);
```

See [`IRebateClaimer`](foundry-contracts/src/interfaces/IRebateClaimer.sol) for the full interface.

**The wallet which claims the rebate is specified by this address, _`rebateClaimer`_**. The backend system performs verification against this address, to prevent griefing scenarios where malicious attackers are claiming rebates they are not entitled to.

# Claim Process: Signatures

The Router Rebates initiative offers two flows for claiming rebates. In the signature flow, an API service operated by Uniswap Foundation, verifies transactions to produce the rebate size and an authorization signature. The authorization signature, along with its corresponding data, is provided to a smart contract on Unichain to claim the rebate.

To prevent signature replays and/or duplicate claiming, rebate claims operate on a block range. Once a block number has been claimed against, transactions occuring prior to the block number are inelligible for rebates.

1. Gather a list of transaction hashes, for a single chain

   ```
   txnHashList = ["0xABC", "0xDEF"]
   ```

2. Provide the chainId and transaction list to the API

   ```bash
   curl -G 'https://router-rebates-testnet.up.railway.app/sign' \
     --data-urlencode 'chainId=1' \
     --data-urlencode 'txnHashes=0xABC,0xDEF'
   ```

3. Example response:

   ```json
   {
     // rebateClaimer address set by the beneficiary
     "claimer": "0x7024cc7e60D6560f0B5877DA2bb921FCbF1f4375",

     // authorization signature to provide to RouterRebates
     "signature": "0xaac2124f1f581cd5e0e9d743250d01d23972a620caadb9df223650be2b5e057862bb8436fb0be03bdd345067e2766d41a10ed2fb42d61d4729283bfd19fd79a71b",

     // amount of rebate determined, wei units of native Ether tokens
     "amount": "26907876080000",

     "startBlockNumber": "7839623",
     "endBlockNumber": "7839623"
   }
   ```

4. Hash the _sorted_ transaction hashes

   Solidity:

   ```solidity
   bytes32[] txnHashes;
   bytes32 hashed = keccak256(abi.encodePacked(txnHashes));
   ```

   Cast:

   ```bash
   cast keccak $(cast abi-encode --packed "(bytes32[])" "[0xABC,0xDEF]")
   ```

5. Claim the rebate, from the **authorized claimer address**

   |          | RouterRebates                                |
   | -------- | -------------------------------------------- |
   | Sepolia  | `0x8c93cc27753df7b5fe735062a4fd8f0e5833e142` |
   | Unichain | TBD                                          |

   ***

   ```solidity
   function claimWithSignature(
       uint256 chainId,
       address beneficiary,
       address recipient,
       uint256 amount,
       bytes32 txnListHash,
       BlockNumberRange calldata blockRange,
       bytes calldata signature
   ) external;
   ```

   | Name        | Type             | Description                                                                                        | Notes                                                                                          |
   | ----------- | ---------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
   | chainId     | uint256          | The chainId of the transaction hashes                                                              | The same chainId provided to the `GET /sign request`                                           |
   | beneficiary | address          | The address of contract that interacted with PoolManager                                           | The swap router contract, should expose a `rebateClaimer() external view returns (address)`    |
   | recipient   | address          | The recipient of the rebate                                                                        | The address should be able to safely recieve native Ether tokens                               |
   | amount      | uint256          | The amount of rebate being claimed                                                                 | The amount returned the `GET /sign request`                                                    |
   | txnListHash | bytes32          | A keccak256 hash of the transaction hashes                                                         | The list of transaction hashes should be alphabetically sorted, and then hashed with keccak256 |
   | blockRange  | BlockNumberRange | A struct of (uint128,uint128) containing the start and end block numbers of the transaction hashes | Start and end block numbers are returned the `GET /sign request`                               |
   | signature   | bytes            | A signature authorizing rebate claims                                                              | Returned by the `GET /sign request`. Internally derived from `abi.encodePacked(r, s, v)`       |

# Glossary

`swap router` / `beneficiary` - the onchain contract, that implements `IUnlockCallback`, and is the caller for `poolManager.swap()`. Can also be thought of as the `sender` address in the `Swap()` event

`claimer` - the address which is claiming the rebate on behalf of the _swap router_ / _beneficiary_

`recipient` - the recipient address that is receiving the rebate

## Claim with Brevis ZK Proof

1. router contract emits event Claimer(address) to indicate which address is authorized to call claim function
2. router project sends list of tx to Brevis backend `zk/new?chainId=1&txnHashes=0x123...,0x456...`, and receives `reqid` in response
3. router project queries `zk/get/{reqid}` to get proof data. Claimer then sends onchain tx to `claimWithZkProof`

```

```

```

```
