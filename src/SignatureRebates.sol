// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import {IERC20} from "forge-std/interfaces/IERC20.sol";
import {Owned} from "solmate/src/auth/Owned.sol";

import {Rebates} from "./base/Rebates.sol";

contract SignatureRebates is Rebates, Owned {
    error HashClaimed();

    event Claimed(bytes32 transactionHash, uint256 caimpaignId, address claimer, address destination, uint256 amount);

    mapping(bytes32 transactionHash => bool seen) public hashUsed;

    constructor(address _owner) Owned(_owner) {}

    function claim(
        uint256 campaignId,
        address destination,
        uint256 amount,
        bytes32 transactionHash,
        bytes memory signature
    ) external {
        if (hashUsed[transactionHash]) revert HashClaimed();

        // TODO: verify signature

        // send amount to destination
        _claim(campaignId, msg.sender, destination, amount);

        emit Claimed(transactionHash, campaignId, msg.sender, destination, amount);
    }

    function claimBatch() external {}
}
