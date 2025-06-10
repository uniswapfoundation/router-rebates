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

> To ensure the longevity of the program and block-stuffing attacks, the campaign will only rebate up to a gas-price of 50 Gwei. The absolute maximum rebate size is equal to `0.8 * txn_gas_used * min(50 gwei, txn_base_fee)`

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

Because `rebateClaimer` is the authorized address to claim rebates, integrators **should take care in securing the address**:

- Avoid making the `rebateClaimer` mutable
- If the address is an EOA, ensure its private key is properly secured

# Claim Process: Signatures

The Router Rebates initiative offers two flows for claiming rebates. In the signature flow, an API service operated by Uniswap Foundation, verifies transactions to produce the rebate size and an authorization signature. The authorization signature, along with its corresponding data, is provided to a smart contract on Unichain to claim the rebate.

To prevent signature replays and/or duplicate claiming, rebate claims operate on a block range. Once a block number has been claimed against, transactions occuring prior to the block number are inelligible for rebates.

1. Gather a list of transaction hashes, for a single chain. Note the sender of the first Swap event of first tx is treated as the beneficiary. Swap events with non-beneficiary sender are ignored.

   ```
   txnHashList = ["0xABC", "0xDEF"]
   ```

2. Provide the chainId, transaction list, and the beneficiary address (swap router) to the API

   ```bash
   curl -G 'https://router-rebates.up.railway.app/sign' \
     --data-urlencode 'chainId=1' \
     --data-urlencode 'txnHashes=0xABC,0xDEF'
     --data-urlencode 'beneficiary=0xA1B2C3
   ```

   Examples

   ```bash
   curl -G 'https://router-rebates.up.railway.app/sign' \
     --data-urlencode 'chainId=84532' \
     --data-urlencode 'txnHashes=0xc8b74808e858649426cb27b49afac8e3690fe159c18ba7ad39c20905a2318537,0x007485bcf859361bcc6203617fe2e2b22ddf396d27ef2bb1ef8e0d161488d55a,0x0082a1b8d11e8241ef1191bbf3610c48083d6cfd8f24b33fc8d0c60804b49a22' \
     --data-urlencode 'beneficiary=0xc60c42b04A01c3378F979dCF54eFD1Fd1BC917F8'
   ```

   ```bash
   curl -G 'https://router-rebates.up.railway.app/sign' \
     --data-urlencode 'chainId=11155111' \
     --data-urlencode 'txnHashes=0xa52a8b26922942cdc37b7148cfe048db7635ed9aa9e49167aa02f71163f11f74,0xecddc81592699264abf46a33f869d56c0a1f75723f3e4a98406d6e8ebf31037d,0x9ac0f370b1467a177ac1b2ec06f561940caf9560508c0e6c3fb0ef480fe9c3df' \
     --data-urlencode 'beneficiary=0xE3b6E8c66419E080269bAf138452122EB3322461'
   ```

3. Example response:

   ```js
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
   | Sepolia  | `0xbf929102ef670abe0dbf852cac637ca36e06bf3a` |
   | Unichain | `0x3EDb72Ab3cA1B0869572cC31B95AA1ea078AE9a0` |

   > :warning: Integrators MUST submit claims ordered by block number. Claims on block range [100, 200] should be submitted BEFORE claims on block range [400, 500]

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

   Example

   ```bash
   cast send $REBATE_CONTRACT_ADDRESS "claimWithSignature(uint256,address,address,uint256,(uint128,uint128),bytes)" \
      $CHAIN_ID \
      $BENEFICIARY_ADDR \
      $RECIPIENT_ADDR \
      $AMOUNT \
      "($START_BLOCK,$END_BLOCK)" \
      $SIGNATURE \
      --rpc-url "https://sepolia.gateway.tenderly.co" \
      --private-key $YOUR_PRIVATE_KEY

   # example:
   cast send 0xBf929102EF670abE0dbF852cAc637cA36e06bf3A "claimWithSignature(uint256,address,address,uint256,(uint128,uint128),bytes)" \
      11155111 \
      0xE3b6E8c66419E080269bAf138452122EB3322461 \
      0x7024cc7e60D6560f0B5877DA2bb921FCbF1f4375 \
      1117413 \
      "(8427649,8427649)" \
      0xfd5f188f32e11fcd9ed1b634b543afffcb4ca7df0a8bd16776453203c706c40e3c568cdb070a43bc541d8c3484becc92ca85763856fff0d0b1d7d95959e564011b \
      --rpc-url "https://sepolia.gateway.tenderly.co" \
      --private-key $YOUR_PRIVATE_KEY
   ```

   > :warning: Once an `endBlockNumber` is claimed, transactions/signatures containing a block number preceeding `endBlockNumber` are INVALID

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
