// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import {IERC20} from "forge-std/interfaces/IERC20.sol";
import {Owned} from "solmate/src/auth/Owned.sol";
import {SignatureVerification} from "permit2/src/libraries/SignatureVerification.sol";
import {EIP712} from "openzeppelin-contracts/contracts/utils/cryptography/EIP712.sol";

import {Rebates} from "./base/Rebates.sol";
import {IRebateClaimer} from "./base/IRebateClaimer.sol";
import {ClaimableHash} from "./libraries/ClaimableHash.sol";
import "forge-std/console2.sol";

contract SignatureRebates is Rebates, EIP712, Owned {
    using SignatureVerification for bytes;

    error InvalidAmount();

    /// @dev Thrown when claiming the rebate with a block number prior to the last claimed block number
    error InvalidBlockNumber();

    /// @dev Thrown when calling claimBatch with an empty list of transaction hashes
    error EmptyHashes();

    /// @dev Thrown when caller is the not the authorized claimer on behalf of the beneficiary
    error UnauthorizedClaimer();

    mapping(address beneficiary => uint256 blockNum) public lastBlockClaimed;

    constructor(string memory _name, address _owner) EIP712(_name, "1") Owned(_owner) {}

    function claimWithSignature(
        uint256 campaignId,
        address beneficiary,
        address recipient,
        uint256 amount,
        bytes32[] calldata transactionHashes,
        uint256 lastBlockNumber,
        bytes calldata signature
    ) external {
        if (transactionHashes.length == 0) revert EmptyHashes();
        if (lastBlockNumber <= lastBlockClaimed[msg.sender]) revert InvalidBlockNumber();
        if (msg.sender != IRebateClaimer(beneficiary).rebateClaimer()) revert UnauthorizedClaimer();

        // TODO: explore calldata of keccak256/encodePacked for optimization
        bytes32 digest =
            ClaimableHash.hashClaimable(campaignId, beneficiary, transactionHashes, lastBlockNumber, amount);
        signature.verify(_hashTypedDataV4(digest), campaigns[campaignId].owner);

        // consume the block number to prevent replaying claims
        lastBlockClaimed[beneficiary] = lastBlockNumber;

        // send amount to recipient
        _claim(campaignId, amount, recipient);
    }

    function DOMAIN_SEPARATOR() external view returns (bytes32) {
        return _domainSeparatorV4();
    }
}
