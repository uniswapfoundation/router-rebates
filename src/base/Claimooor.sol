// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import {SignatureRebates} from "../SignatureRebates.sol";

abstract contract Claimooor {
    SignatureRebates public immutable rebates;

    constructor(SignatureRebates _rebates) {
        rebates = _rebates;
    }

    /// TODO: permission this!!
    function claimRebates(
        uint256 campaignId,
        address recipient,
        uint256 amount,
        bytes32[] calldata transactionHashes,
        uint256 lastBlockNumber,
        bytes calldata signature
    ) external {
        rebates.claimWithSignature(campaignId, recipient, amount, transactionHashes, lastBlockNumber, signature);
    }
}
