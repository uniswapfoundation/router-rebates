// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import {SignatureRebates} from "../SignatureRebates.sol";
import {IRebateClaimer} from "./IRebateClaimer.sol";

abstract contract Claimooor is IRebateClaimer {
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
        rebates.claimWithSignature(
            campaignId, address(this), recipient, amount, transactionHashes, lastBlockNumber, signature
        );
    }

    function rebateClaimer() external view override returns (address) {
        return address(this);
    }
}
