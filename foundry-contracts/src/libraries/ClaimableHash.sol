// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.0;

library ClaimableHash {
    bytes32 constant CLAIMABLE_TYPEHASH = keccak256(
        "Claimable(address claimer,address beneficiary,uint256 chainId,uint128 startBlockNumber,uint128 endBlockNumber,uint256 amount)"
    );

    function hashClaimable(
        address claimer,
        address beneficiary,
        uint256 chainId,
        uint128 startBlockNumber,
        uint128 endBlockNumber,
        uint256 amount
    ) internal pure returns (bytes32 digest) {
        // Encode parameters for EIP-712 typed signatures
        return keccak256(
            abi.encode(CLAIMABLE_TYPEHASH, claimer, beneficiary, chainId, startBlockNumber, endBlockNumber, amount)
        );
    }
}
