Notes:

1. start anvil

2. run bun server

```bash
cd rebate-signer
bun run dev
```

3. run ponder

```bash
cd poolid-indexer
npm run dev
```

---

# Router Rebates

A gas subsidy program, sponsored by Uniswap Foundation and Brevis, to encourage routing and solving integration with Uniswap v4 Hooks.

---

# Program Specs

For any transaction which touches a Uniswap v4 pool, with a hook, authors of the swap router (`sender` address in the `Swap` event), will be able to claim a rebate against the gas spent. Rebates will be available on the 12 initial chains with Uniswap v4, with claims faciliated on Unichain. The rebate is paid out as native ether tokens.

### Rebate Size

For a given transaction hash, with swap events coming from a hook'ed pool, the rebate is calculated with:

```
gasUsage = 80,000 * number_of_swap_events + 80,000
rebateEth = gasUsage * txnReceipt.baseFee
```

> As a safety precaution against hyper-optimized swap, the minimum of the above calculation or _80% of transaction gas usage_ is taken

# Router Integrations

Because rebates are claimed on Unichain for trades happening on other networks, _beneficiaries_ need to specify the authorized claimer.

The swap router contract (the contract calling `poolManager.swap()`) should implement this function selector:

```solidity
function rebateClaimer() external view returns (address);
```

See [`IRebateClaimer`](foundry-contracts/src/interfaces/IRebateClaimer.sol) for the full interface.

**The wallet which claims the rebate is specified by this address**. The backend system performs verification against this address, to prevent griefing scenarios where malicious attackers are claiming rebates they are not entitled to.

# Claim Process: Signatures

The Router Rebates initiative offers two flows for claiming rebates. In the signature flow, an API service operated by Uniswap Foundation, verifies transactions to produce the rebate size and an authorization signature. The authorization signature, along with its corresponding data, is provided to a smart contract on Unichain to claim the rebate.

To prevent signature replays and/or duplicate claiming, rebate claims operate on a block range. Once a block number has been claimed against, transactions occuring prior to the block number are inelligible for rebates.

1. Gather a list of transaction hashes, for a single chain

```
txnHashList = ["", ""]
```

2. Provide the chainId and transaction list to the API

```bash
curl -G 'http:/localhost:3000/sign' --data-urlencode 'chainId=1' --data-urlencode 'txnHashes=0x77014b4caad9c07a4840d6874d6f219ec3476c0311c90036e5f2e4c8072396f6,0xa2b356e88e7b8a2992711790e57a4c0dba7d409d97ea19cd42102f39dbddc3c9'
```

3. Claim the rebate, from the **authorized claimer address**, on Unichain

```solidity
IRouterRebates(routerRebateAddress).claimWithSignature(...);
```

# Glossary

`swap router` / `beneficiary` - the onchain contract, that implements `IUnlockCallback`, and is the caller for `poolManager.swap()`

`claimer` - the address which is claiming the rebate on behalf of the _swap router_ / _beneficiary_

`recipient` - the recipient address that is receiving the rebate

## Claim with Brevis ZK Proof

1. router contract emits event Claimer(address) to indicate which address is authorized to call claim function
2. router project sends list of tx to Brevis backend `zk/new?chainId=1&txnHashes=0x123...,0x456...`, and receives `reqid` in response
3. router project queries `zk/get/{reqid}` to get proof data. Claimer then sends onchain tx to `claimWithZkProof`

```

```
