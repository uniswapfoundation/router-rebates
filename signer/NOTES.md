### Testing / Validation notes

1. Execute `foundry-contracts/script/Sepolia.s.sol` and `foundry-contracts/script/BaseSepolia.s.sol`

2. Fetch transaction hashes from `foundry-contracts/broadcast/*/*/run-latest.json`

3. Fetch signature

```bash
curl -G 'https://router-rebates-testnet.up.railway.app/sign' --data-urlencode 'chainId=11155111' --data-urlencode 'txnHashes=0x6a7fb847ae79fbd3689e8c103c8b8c35a27568ab7cf51595d325faa9e559fafe,0x8b978e9082074e5483023f92754465198b6040ce75787fc4427ba4ec25057aaa'
```

4. Claim rebate

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

```bash
cast send \
  --rpc-url sepolia \
  --private-key $SEPOLIA_PK \
  0x6bec6dff20730840266a2434bcc4c3aa0b139482 \
  "claimWithSignature(uint256,address,address,uint256,bytes32,(uint128,uint128),bytes)" \
  11155111 \
  0x6e9acd753e56f15c779f0348c95b97ce83d8796d \
  0x7024cc7e60D6560f0B5877DA2bb921FCbF1f4375 \
  82804883968043 \
  0xcc8efdee0c426e7c43ab68706977d9cdc0beceac68ba8181d9f4fff65d584079 \
  "(7839634,7839637)" \
  0x5c7d6b060b3374d88d30e19e4cafac999fd968d1135da2261c03c5f8dc2d981148a9d17042279314e9efc0542674d395129f65ba4216cea29b53316dc60b2a911b
```
