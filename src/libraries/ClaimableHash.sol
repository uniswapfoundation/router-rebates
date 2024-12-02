// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.0;

library ClaimableHash {
    bytes32 constant CLAIMABLE_TYPEHASH = keccak256(
        "Claimable(uint256 campaignId,address claimer,address beneficiary,bytes32[] transactionHashes,uint256 lastBlockNumber,uint256 amount)"
    );

    function hashClaimable(
        uint256 campaignId,
        address claimer,
        address beneficiary,
        bytes32[] calldata transactionHashes,
        uint256 lastBlockNumber,
        uint256 amount
    ) internal pure returns (bytes32 digest) {
        // need to keccak256/encodePacked transactionHashes as its a dynamic type
        return keccak256(
            abi.encode(
                CLAIMABLE_TYPEHASH,
                campaignId,
                claimer,
                beneficiary,
                keccak256(abi.encodePacked(transactionHashes)),
                lastBlockNumber,
                amount
            )
        );
    }
}
