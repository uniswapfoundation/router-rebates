Notes:

bun run index

curl http://localhost:3000/31337/0x8dd4d5013af604c89e48cc9ab7cd2b8f26c4434887f11ac65bf8ee8b1cfc2e93

curl http://localhost:3000/31337/batch?transaction_hashes=0x1,0x2,0x3

curl "http://localhost:3000/31337/s/batch?tags[]=tag1&tags[]=tag2&tags[]=tag3"

curl "http://localhost:3000/sign?tags[]=tag1&tags[]=tag2&tags[]=tag3"

curl "http://localhost:3000/sign?campaignId=1&txnHashes[]=tag1&tags[]=tag2"

---

## Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

Foundry consists of:

- **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
- **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
- **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
- **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## Documentation

https://book.getfoundry.sh/

## Usage

### Build

```shell
$ forge build
```

### Test

```shell
$ forge test
```

### Format

```shell
$ forge fmt
```

### Gas Snapshots

```shell
$ forge snapshot
```

### Anvil

```shell
$ anvil
```

### Deploy

```shell
$ forge script script/Counter.s.sol:CounterScript --rpc-url <your_rpc_url> --private-key <your_private_key>
```

### Cast

```shell
$ cast <subcommand>
```

### Help

```shell
$ forge --help
$ anvil --help
$ cast --help
```
