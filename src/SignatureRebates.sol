// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import {IERC20} from "forge-std/interfaces/IERC20.sol";
import {Owned} from "solmate/src/auth/Owned.sol";
import {SignatureVerification} from "permit2/src/libraries/SignatureVerification.sol";
import {EIP712} from "openzeppelin-contracts/contracts/utils/cryptography/EIP712.sol";

import {Rebates} from "./base/Rebates.sol";
import {ClaimableHash} from "./libraries/ClaimableHash.sol";
import "forge-std/console2.sol";

contract SignatureRebates is Rebates, EIP712, Owned {
    using SignatureVerification for bytes;

    error InvalidAmount();
    error HashUsed(bytes32 txnHash);

    /// @dev Thrown when calling claimBatch with an empty list of transaction hashes
    error EmptyHashes();

    event Claimed(bytes32 transactionHash, uint256 caimpaignId, address claimer, address destination, uint256 amount);

    mapping(bytes32 transactionHash => bool seen) public hashUsed;

    constructor(string memory _name, address _owner) EIP712(_name, "1") Owned(_owner) {}

    function claimBatch(
        uint256 campaignId,
        address destination,
        uint256 amount,
        bytes32[] calldata transactionHashes,
        bytes calldata signature
    ) external {
        if (transactionHashes.length == 0) revert EmptyHashes();

        // TODO: explore calldata of keccak256/encodePacked for optimization
        bytes32 digest = ClaimableHash.hashClaimableBatch(campaignId, msg.sender, transactionHashes, amount);
        signature.verify(_hashTypedDataV4(digest), campaigns[campaignId].owner);

        // spend the transaction hashes so they are not re-usable
        uint256 i;
        bytes32 txnHash;
        for (i; i < transactionHashes.length; ++i) {
            txnHash = transactionHashes[i];
            if (hashUsed[txnHash]) revert HashUsed(txnHash);
            hashUsed[txnHash] = true;
        }

        // send amount to destination
        _claim(campaignId, amount, destination);
    }

    function DOMAIN_SEPARATOR() external view returns (bytes32) {
        return _domainSeparatorV4();
    }
}
