// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.0;

library ClaimableHash {
    bytes32 constant CLAIMABLE_BATCH_TYPEHASH =
        keccak256("ClaimableBatch(uint256 campaignId,address referrer,bytes32[] transactionHashes,uint256 amount)");

    function hashClaimableBatch(
        uint256 campaignId,
        address referrer,
        bytes32[] calldata transactionHashes,
        uint256 amount
    ) internal pure returns (bytes32 digest) {
        // need to keccak256/encodePacked transactionHashes as its a dynamic type
        return keccak256(
            abi.encode(
                CLAIMABLE_BATCH_TYPEHASH, campaignId, referrer, keccak256(abi.encodePacked(transactionHashes)), amount
            )
        );
    }
}
