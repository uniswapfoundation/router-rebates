// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import {IERC20} from "forge-std/interfaces/IERC20.sol";
import {Owned} from "solmate/src/auth/Owned.sol";
import {SignatureVerification} from "permit2/src/libraries/SignatureVerification.sol";

import {Rebates} from "./base/Rebates.sol";
import {ClaimableHash} from "./libraries/ClaimableHash.sol";

contract SignatureRebates is Rebates, Owned {
    using SignatureVerification for bytes;

    error InvalidAmount();
    error HashClaimed();

    event Claimed(bytes32 transactionHash, uint256 caimpaignId, address claimer, address destination, uint256 amount);

    mapping(bytes32 transactionHash => bool seen) public hashUsed;

    constructor(address _owner) Owned(_owner) {}

    function claim(
        uint256 campaignId,
        address destination,
        uint256 amount,
        bytes32 transactionHash,
        uint256 amountMax,
        bytes calldata signature
    ) external {
        if (hashUsed[transactionHash]) revert HashClaimed();
        if (amountMax < amount) revert InvalidAmount();

        bytes32 digest = ClaimableHash.hashClaimable(msg.sender, transactionHash, amount);
        signature.verify(digest, campaigns[campaignId].owner);

        // send amount to destination
        _claim(campaignId, msg.sender, destination, amount);

        emit Claimed(transactionHash, campaignId, msg.sender, destination, amount);
    }

    function claimBatch(
        uint256 campaignId,
        address destination,
        uint256 amount,
        bytes32[] calldata transactionHash,
        uint256 amountMax,
        bytes calldata signature
    ) external {}
}
