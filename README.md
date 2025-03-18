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

# Glossary

`swap router` / `beneficiary` - the onchain contract, that implements `IUnlockCallback`, and is the caller for `poolManager.swap()`. Can also be thought of as the `sender` address in the `Swap()` event

`claimer` - the address which is claiming the rebate on behalf of the _swap router_ / _beneficiary_

`recipient` - the recipient address that is receiving the rebate

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

1. Gather a list of transaction hashes, for a single chain. Note the sender of the first Swap event of first tx is treated as the beneficiary. Swap events with non-beneficiary sender are ignored.

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

4. Claim the rebate, from the **authorized claimer address**

   |          | RouterRebates                                |
   | -------- | -------------------------------------------- |
   | Sepolia  | `0x6bec6dff20730840266a2434bcc4c3aa0b139482` |
   | Unichain | TBD                                          |

   ***

   ```solidity
   function claimWithSignature(
       uint256 chainId,
       address beneficiary,
       address recipient,
       uint256 amount,
       BlockNumberRange calldata blockRange,
       bytes calldata signature
   ) external;
   ```

   | Name        | Type             | Description                                                                                        | Notes                                                                                       |
   | ----------- | ---------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
   | chainId     | uint256          | The chainId of the transaction hashes                                                              | The same chainId provided to the `GET /sign request`                                        |
   | beneficiary | address          | The address of contract that interacted with PoolManager                                           | The swap router contract, should expose a `rebateClaimer() external view returns (address)` |
   | recipient   | address          | The recipient of the rebate                                                                        | The address should be able to safely recieve native Ether tokens                            |
   | amount      | uint256          | The amount of rebate being claimed                                                                 | The amount returned the `GET /sign request`                                                 |
   | blockRange  | BlockNumberRange | A struct of (uint128,uint128) containing the start and end block numbers of the transaction hashes | Start and end block numbers are returned the `GET /sign request`                            |
   | signature   | bytes            | A signature authorizing rebate claims                                                              | Returned by the `GET /sign request`. Internally derived from `abi.encodePacked(r, s, v)`    |

# Claim Process: Brevis ZK Proof

Router projects can also claim gas rebates using Brevis ZK proof in a trust-free manner. High level flow is similar to signature-based above except that a ZK proof is returned from Brevis backend and sent to onchain contract by the claimer.

1. Brevis system recognizes claimer address from router contract's `rebateClaimer`
2. Provide the chainId and transaction list to Brevis backend `xxxx(tbd).brevis.network/zk/new` in the same format as signature-based flow, and receives `reqid` in response as generating ZK proof is async
3. Query `xxxx(tbd).brevis.network/zk/get/{reqid}` to get ZK proof and data to submit onchain. See full response object definition [here](https://github.com/brevis-network/uniswap-rebate/blob/v4/proto/webapi.proto)
4. Claimer sends onchain tx to the same RouterRebates contract's `claimWithZkProof` function

```solidity
function claimWithZkProof(
    uint64 chainid, // swaps happened on this chainid, ie. 1 for eth mainnet
    address recipient, // eth will be sent to this address
    bytes calldata _proof,
    bytes[] calldata _appCircuitOutputs,
    bytes32[] calldata _proofIds,
    IBrevisProof.ProofData[] calldata _proofDataArray
)
```

| Name                | Type                     | Description                           | Notes                                                            |
| ------------------- | ------------------------ | ------------------------------------- | ---------------------------------------------------------------- |
| chainId             | uint64                   | The chainId of the transaction hashes | The same chainId provided to the `GET /zk/new request`           |
| recipient           | address                  | The recipient of the rebate           | The address should be able to safely recieve native Ether tokens |
| \_proof             | bytes                    | ZK proof received from Brevis backend | Included in zk/get/ response object                              |
| \_appCircuitOutputs | bytes[]                  | ZK circuit output data                | Included in zk/get/ response object                              |
| \_proofIds          | bytes32[]                | IDs identifiying each ZK proof        | Included in zk/get/ response object                              |
| \_proofDataArray    | IBrevisProof.ProofData[] | Data required by ZK verification      | Included in zk/get/ response object                              |
