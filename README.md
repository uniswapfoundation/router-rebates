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

# Gas Rebate

A gas rebate program, sponsored by Uniswap Foundation and Brevis, to encourage routing and solving integration with Uniswap v4 Hooks.

---

# Glossary

`swap router` / `beneficiary` - the onchain contract, that implements `IUnlockCallback`, and is the caller for `poolManager.swap()`

`claimer` - the address which is claiming the rebate on behalf of the _swap router_ / _beneficiary_

`recipient` - the recipient address that is receiving the rebate
