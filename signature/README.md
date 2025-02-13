## Local Development Guide

1. Start Anvil

```bash
cd ../foundry-contracts
anvil --chain-id 1
```

2. Deploy v4 and Generate Data

```bash
cd ../foundry-contracts
forge script script/Anvil.s.sol --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --broadcast
```

3. Start PoolId Indexer

```bash
cd poolid-indexer
npm run dev
```

4. Start Signature API

```bash
cd rebate-signer
bun run dev
```

5. Generate Signature

> Grab transaction hashes from `broadcast/Anvil.s.sol/1/run-latest.json`

```bash
curl -G 'http:/localhost:3000/sign' --data-urlencode 'campaignId=1' --data-urlencode 'txnHashes=0x77014b4caad9c07a4840d6874d6f219ec3476c0311c90036e5f2e4c8072396f6,0xa2b356e88e7b8a2992711790e57a4c0dba7d409d97ea19cd42102f39dbddc3c9'

curl -G 'http:/localhost:42069/sign' --data-urlencode 'chainId=31337' --data-url 'txnHashes=0xf8f0b94e18cc89a54f406d4d946c80398a3d4ae4a6dea29106406d9b46eaea69'
```

6. Provide Signature to Contract

```bash
cast call REBATE_ADDRESS "claimWithSignature(address,address,uint256,bytes32[],uint256,bytes) \
    BENEFICIARY \
    0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
    AMOUNT \
    "[0x1,0x2]" \
    LAST_BLOCK_NUMBER \
    --private-key 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d \
    --rpc-url http://localhost:8545
```

# Foot Gun Notes:

- transaction hash list should be sorted, as calldata to the contract

- the beneficiary should be uniform and the same across all transaction hashes
  - we take the first transaction hash provided and use the first beneficiary in the first swap event
