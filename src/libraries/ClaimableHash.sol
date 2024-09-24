// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.0;

library ClaimableHash {
    /// @dev equal to keccak256("Claimable(address referrer,bytes32 transactionHash,uint256 amountMax)")
    /// @dev made in-line constant to be accessed in yul
    bytes32 constant CLAIMABLE_TYPEHASH = 0x8ec976293390e4c062de2e5676c4c0d46ef020a3bb6e48ec6ee9abf9f84f2899;

    bytes32 constant CLAIMABLE_BATCH_TYPEHASH =
        keccak256("ClaimableBatch(address referrer,bytes32[] transactionHashes,uint256 amount)");

    function hashClaimable(address referrer, bytes32 transactionHash, uint256 amountMax)
        internal
        pure
        returns (bytes32 digest)
    {
        // equivalent to: keccak256(abi.encode(CLAIMABLE_TYPEHASH, referrer, transactionHash, amountMax));
        assembly ("memory-safe") {
            let fmp := mload(0x40)
            mstore(fmp, CLAIMABLE_TYPEHASH)
            mstore(add(fmp, 0x20), and(referrer, 0xffffffffffffffffffffffffffffffffffffffff))
            mstore(add(fmp, 0x40), transactionHash)
            mstore(add(fmp, 0x60), amountMax)
            digest := keccak256(fmp, 0x80)

            // now clean the memory we used
            mstore(fmp, 0) // fmp held PERMIT_TYPEHASH
            mstore(add(fmp, 0x20), 0) // fmp+0x20 held referrer
            mstore(add(fmp, 0x40), 0) // fmp+0x40 held transactionHash
            mstore(add(fmp, 0x60), 0) // fmp+0x60 held amountMax
        }
    }

    function hashClaimableBatch(address referrer, bytes32[] calldata transactionHashes, uint256 amount)
        internal
        pure
        returns (bytes32 digest)
    {
        return keccak256(abi.encode(CLAIMABLE_BATCH_TYPEHASH, referrer, transactionHashes, amount));
    }
}
