// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.0;

library ClaimableHash {
    bytes32 constant CLAIMABLE_TYPEHASH = keccak256(
        "Claimable(address claimer,address beneficiary,uint256 chainId,bytes32 hashedTxns,uint128 startBlockNumber,uint128 endBlockNumber,uint256 amount)"
    );

    function hashClaimable(
        address claimer,
        address beneficiary,
        uint256 chainId,
        bytes32 txnListHash,
        uint128 startBlockNumber,
        uint128 endBlockNumber,
        uint256 amount
    ) internal pure returns (bytes32 digest) {
        // need to keccak256/encodePacked transactionHashes as its a dynamic type
        return keccak256(
            abi.encode(
                CLAIMABLE_TYPEHASH, claimer, beneficiary, chainId, txnListHash, startBlockNumber, endBlockNumber, amount
            )
        );
    }
}
