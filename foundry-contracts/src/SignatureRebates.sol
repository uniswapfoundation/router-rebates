// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import {IERC20} from "forge-std/interfaces/IERC20.sol";
import {Owned} from "solmate/src/auth/Owned.sol";
import {SignatureVerification} from "permit2/src/libraries/SignatureVerification.sol";
import {EIP712} from "openzeppelin-contracts/contracts/utils/cryptography/EIP712.sol";

import {IRebateClaimer} from "./base/IRebateClaimer.sol";
import {ClaimableHash} from "./libraries/ClaimableHash.sol";
import {Currency, CurrencyLibrary} from "v4-core/src/types/Currency.sol";
import {IBrevisProof} from "./interfaces/IBrevisProof.sol";
import "forge-std/console2.sol";

struct BlockNumberRange {
    uint128 startBlockNumber;
    uint128 endBlockNumber;
}

contract SignatureRebates is EIP712, Owned {
    using SignatureVerification for bytes;

    error InvalidAmount();

    /// @dev Thrown when claiming the rebate with a block number prior to the last claimed block number
    error InvalidBlockNumber();

    /// @dev Thrown when calling claimWithSignature with an empty list of transaction hashes
    error EmptyHashes();

    // (n * rebatePerSwap) + rebateFixed
    uint256 public rebatePerSwap = 80_000; // gas units to rebate per swap event
    uint256 public rebatePerHook = 0;
    uint256 public rebateFixed = 80_000; // fixed gas units to rebate (to be appended to the total rebate)
    address public signer;

    IBrevisProof public brvProof;
    bytes32 public vkHash; // ensure output is from expected zk circuit

    mapping(address beneficiary => uint256 blockNum) public lastBlockClaimed;

    // set safety limits for rebates
    uint256 constant MAX_REBATE_PER_SWAP = 100_000;
    uint256 constant MAX_REBATE_PER_HOOK = 80_000;
    uint256 constant MAX_REBATE_FIXED = 120_000;

    constructor(string memory _name, address _owner) EIP712(_name, "1") Owned(_owner) {
        signer = _owner;
    }

    function claimWithSignature(
        address beneficiary,
        address recipient,
        uint256 amount,
        bytes32[] calldata transactionHashes,
        BlockNumberRange calldata blockRange,
        bytes calldata signature
    ) external {
        if (transactionHashes.length == 0) revert EmptyHashes();
        // startBlockNumber must be less than endBlockNumber
        if (blockRange.startBlockNumber >= blockRange.endBlockNumber) revert InvalidBlockNumber();
        if (blockRange.startBlockNumber < lastBlockClaimed[beneficiary]) revert InvalidBlockNumber();

        // TODO: explore calldata of keccak256/encodePacked for optimization
        bytes32 digest = ClaimableHash.hashClaimable(
            msg.sender, beneficiary, transactionHashes, blockRange.startBlockNumber, blockRange.endBlockNumber, amount
        );
        signature.verify(_hashTypedDataV4(digest), signer);

        // consume the block number to prevent replaying claims
        lastBlockClaimed[beneficiary] = blockRange.endBlockNumber - 1;

        // send amount to recipient
        CurrencyLibrary.ADDRESS_ZERO.transfer(recipient, amount);
    }

    function DOMAIN_SEPARATOR() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    function setRebate(uint256 _rebatePerSwap, uint256 _rebatePerHook, uint256 _rebateFixed) external onlyOwner {
        require(_rebatePerSwap <= MAX_REBATE_PER_SWAP, "exceeds MAX_REBATE_PER_SWAP");
        require(_rebatePerHook <= MAX_REBATE_PER_HOOK, "exceeds MAX_REBATE_PER_HOOK");
        require(_rebateFixed <= MAX_REBATE_FIXED, "exceeds MAX_REBATE_FIXED");
        rebatePerSwap = _rebatePerSwap;
        rebatePerHook = _rebatePerHook;
        rebateFixed = _rebateFixed;
    }

    function setSigner(address _signer) external onlyOwner {
        require(signer != address(0));
        signer = _signer;
    }

    function setZkConfig(IBrevisProof _brvproof, bytes32 _vkHash) external onlyOwner {
        brvProof = _brvproof;
        vkHash = _vkHash;
    }

    function claimWithZkProof(
        uint64 chainid, // swaps happened on this chainid, ie. 1 for eth mainnet
        address recipient, // eth will be sent to this address
        bytes calldata _proof,
        bytes[] calldata _appCircuitOutputs,
        bytes32[] calldata _proofIds,
        IBrevisProof.ProofData[] calldata _proofDataArray
    ) external {
        uint256 amount = 0; // total eth
        if (_appCircuitOutputs.length == 1) {
            bytes calldata _appOutput = _appCircuitOutputs[0];
            // check proof
            (, bytes32 appCommitHash, bytes32 appVkHash) = brvProof.submitProof(chainid, _proof);
            require(appVkHash == vkHash, "mismatch vkhash");
            require(appCommitHash == keccak256(_appOutput), "invalid circuit output");
            amount = handleOutput(_appOutput);
            if (amount > 0) {
                (bool sent,) = recipient.call{value: amount}("");
                require(sent, "failed to send eth");
            }
            return;
        }
        // batch mode
        brvProof.submitAggProof(chainid, _proofIds, _proof);
        brvProof.validateAggProofData(chainid, _proofDataArray);
        // verify data and output
        for (uint256 i = 0; i < _proofIds.length; i++) {
            require(_proofDataArray[i].appVkHash == vkHash, "mismatch vkhash");
            require(_proofDataArray[i].commitHash == _proofIds[i], "invalid proofId");
            require(_proofDataArray[i].appCommitHash == keccak256(_appCircuitOutputs[i]), "invalid circuit output");
            amount += handleOutput(_appCircuitOutputs[i]);
        }
        if (amount > 0) {
            (bool sent,) = recipient.call{value: amount}("");
            require(sent, "failed to send eth");
        }
    }

    // parse _appOutput, return total eth amount
    // one output has router(20), claimer(20), fromblk(8), toblk(8), eth amount(16)
    function handleOutput(bytes calldata _appOutput) internal returns (uint256) {
        require(_appOutput.length == 72, "incorrect app output length");
        // router is msg.sender for Swap
        address router = address(bytes20(_appOutput[0:20]));
        address claimer = address(bytes20(_appOutput[20:40]));
        require(msg.sender == claimer, "msg.sender is not authorized claimer");
        uint64 beginBlk = uint64(bytes8(_appOutput[40:48]));
        uint64 endBlk = uint64(bytes8(_appOutput[48:56]));
        require(beginBlk > lastBlockClaimed[router], "begin blocknum too small");
        lastBlockClaimed[router] = endBlk;
        return uint128(bytes16(_appOutput[56:72]));
    }

    // accept eth transfer
    receive() external payable {}
    fallback() external payable {}
}
