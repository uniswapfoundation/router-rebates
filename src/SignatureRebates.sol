// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import {IERC20} from "forge-std/interfaces/IERC20.sol";
import {Owned} from "solmate/src/auth/Owned.sol";
import {SignatureVerification} from "permit2/src/libraries/SignatureVerification.sol";
import {EIP712} from "openzeppelin-contracts/contracts/utils/cryptography/EIP712.sol";

import {IRebateClaimer} from "./base/IRebateClaimer.sol";
import {ClaimableHash} from "./libraries/ClaimableHash.sol";
import {Currency, CurrencyLibrary} from "v4-core/src/types/Currency.sol";
import "forge-std/console2.sol";

contract SignatureRebates is EIP712, Owned {
    using SignatureVerification for bytes;

    error InvalidAmount();

    /// @dev Thrown when claiming the rebate with a block number prior to the last claimed block number
    error InvalidBlockNumber();

    /// @dev Thrown when calling claimWithSignature with an empty list of transaction hashes
    error EmptyHashes();

    uint256 public rebatePerSwap = 10_000;
    uint256 public rebatePerHook = 0;
    address public signer;

    mapping(address beneficiary => uint256 blockNum) public lastBlockClaimed;

    constructor(string memory _name, address _owner) EIP712(_name, "1") Owned(_owner) {
        signer = _owner;
    }

    function claimWithSignature(
        address beneficiary,
        address recipient,
        uint256 amount,
        bytes32[] calldata transactionHashes,
        uint256 lastBlockNumber,
        bytes calldata signature
    ) external {
        if (transactionHashes.length == 0) revert EmptyHashes();
        if (lastBlockNumber <= lastBlockClaimed[beneficiary]) revert InvalidBlockNumber();

        // TODO: explore calldata of keccak256/encodePacked for optimization
        bytes32 digest =
            ClaimableHash.hashClaimable(msg.sender, beneficiary, transactionHashes, lastBlockNumber, amount);
        signature.verify(_hashTypedDataV4(digest), signer);

        // consume the block number to prevent replaying claims
        lastBlockClaimed[beneficiary] = lastBlockNumber;

        // send amount to recipient
        CurrencyLibrary.ADDRESS_ZERO.transfer(recipient, amount);
    }

    function DOMAIN_SEPARATOR() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    function setRebate(uint256 _rebatePerSwap, uint256 _rebatePerHook) external onlyOwner {
        rebatePerSwap = _rebatePerSwap;
        rebatePerHook = _rebatePerHook;
    }

    function setSigner(address _signer) external onlyOwner {
        require(signer != address(0));
        signer = _signer;
    }
}
