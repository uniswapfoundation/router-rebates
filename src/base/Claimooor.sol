// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import {SignatureRebates} from "../SignatureRebates.sol";

abstract contract Claimooor {
    SignatureRebates public immutable rebates;

    constructor(SignatureRebates _rebates) {
        rebates = _rebates;
    }

    /// TODO: permission this!!
    function claimRebate(
        uint256 campaignId,
        address recipient,
        uint256 amount,
        bytes32 transactionHash,
        uint256 amountMax,
        bytes calldata signature
    ) external {
        rebates.claim(campaignId, recipient, amount, transactionHash, amountMax, signature);
    }
}
