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

    IBrevisProof public brvProof;
    bytes32 public vkHash; // ensure output is from expected zk circuit

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

    function setZkConfig(IBrevisProof _brvproof, bytes32 _vkHash) external onlyOwner {
        brvProof = _brvproof;
        vkHash = _vkHash;
    }

    function claimWithZkProof(
        address receiver, // eth will be sent to this address
        bytes calldata _proof,
        bytes[] calldata _appCircuitOutputs,
        bytes32[] calldata _proofIds,
        IBrevisProof.ProofData[] calldata _proofDataArray
    ) external {
        uint256 amount = 0; // total eth
        if (_appCircuitOutputs.length == 1 ) {
            bytes calldata _appOutput = _appCircuitOutputs[0];
            // check proof
            (, bytes32 appCommitHash, bytes32 appVkHash) = brvProof.submitProof(uint64(block.chainid), _proof);
            require(appVkHash == vkHash, "mismatch vkhash");
            require(appCommitHash == keccak256(_appOutput), "invalid circuit output");
            amount = handleOutput(_appOutput);
            if(amount > 0 ) {
                (bool sent, ) = receiver.call{value: amount}("");
                require(sent, "failed to send eth");
            }
            return;
        }
        // batch mode
        brvProof.submitAggProof(uint64(block.chainid), _proofIds, _proof);
        brvProof.validateAggProofData(uint64(block.chainid), _proofDataArray);
        // verify data and output
        for (uint256 i=0;i<_proofIds.length;i++) {
            require(_proofDataArray[i].appVkHash == vkHash, "mismatch vkhash");
            require(_proofDataArray[i].commitHash == _proofIds[i], "invalid proofId");
            require(_proofDataArray[i].appCommitHash == keccak256(_appCircuitOutputs[i]), "invalid circuit output");
            amount += handleOutput(_appCircuitOutputs[i]);
        }
        if(amount > 0) {
            (bool sent, ) = receiver.call{value: amount}("");
            require(sent, "failed to send eth");
        }
    }

    // parse _appOutput, return total eth amount
    // one output has addr(20), [poolid(32), fromblk(8), toblk(8), eth amount(16)]
    // circuit will ensure poolid is valid ie. PoolKey.hooks is non-zero
    function handleOutput(bytes calldata _appOutput) internal returns (uint256) {
        uint256 amount = 0;
        require(_appOutput.length >= 84, "not enough app output");
        require((_appOutput.length-20) % 64 == 0, "incorrect app output");
    
        // sender is msg.sender for Swap
        address sender = address(bytes20(_appOutput[0:20]));
        require(msg.sender==sender, "mismatch msg.sender and circuit output");

        for (uint256 idx=20;idx<_appOutput.length;idx+=64) {
            bytes32 poolid = bytes32(_appOutput[idx:idx+32]);
            if(poolid == 0) {
                break; // circuit may have zero fillings due to fixed length, ends loop early to save gas
            }
            uint64 beginBlk = uint64(bytes8(_appOutput[idx+32:idx+40]));
            uint64 endBlk = uint64(bytes8(_appOutput[idx+40:idx+48]));
            if(beginBlk>lastBlockNum[sender][poolid]) {
                lastBlockNum[sender][poolid] = endBlk;
                amount += uint128(bytes16(_appOutput[68:84]));
            }
        }
        return amount;
    }

    // accept eth transfer
    receive() external payable {}
    fallback() external payable {}
}
