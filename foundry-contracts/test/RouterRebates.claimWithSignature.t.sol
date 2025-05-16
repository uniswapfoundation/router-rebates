// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import {Currency, CurrencyLibrary} from "v4-core/src/types/Currency.sol";
import {IERC20} from "forge-std/interfaces/IERC20.sol";
import {MockERC20} from "solmate/src/test/utils/mocks/MockERC20.sol";
import {SignatureVerification} from "permit2/src/libraries/SignatureVerification.sol";

import {ClaimableHash} from "../src/libraries/ClaimableHash.sol";
import {BlockNumberRange, RouterRebates} from "../src/RouterRebates.sol";
import {IRebateClaimer} from "../src/base/IRebateClaimer.sol";

contract RouterRebatesTest is Test {
    RouterRebates public rebates;
    uint256 campaignId;
    uint256 nativeEthCampaignId;

    address alice;
    uint256 alicePK;

    address bob;
    uint256 bobPK;

    // TODO: use ISignatureRebate
    error InvalidBlockNumber();
    error InvalidAmount();

    function setUp() public {
        rebates = new RouterRebates("REBATES", address(this));

        (alice, alicePK) = makeAddrAndKey("ALICE");
        (bob, bobPK) = makeAddrAndKey("BOB");

        rebates.setSigner(alice);

        // deposit and fund the campaign
        vm.deal(address(rebates), 10 ether);
    }

    function test_claimableTypehash() public pure {
        assertEq(
            ClaimableHash.CLAIMABLE_TYPEHASH,
            keccak256(
                "Claimable(address claimer,address beneficiary,uint256 chainId,uint128 startBlockNumber,uint128 endBlockNumber,uint256 amount)"
            )
        );
    }

    function test_claimableHash(
        address claimer,
        address beneficiary,
        uint256 chainId,
        bytes32[] calldata transactionHashes,
        uint128 startBlockNumber,
        uint128 endBlockNumber,
        uint256 amount
    ) public pure {
        assertEq(
            ClaimableHash.hashClaimable(claimer, beneficiary, chainId, startBlockNumber, endBlockNumber, amount),
            keccak256(
                abi.encode(
                    ClaimableHash.CLAIMABLE_TYPEHASH,
                    claimer,
                    beneficiary,
                    chainId,
                    startBlockNumber,
                    endBlockNumber,
                    amount
                )
            )
        );
    }

    function test_signature_claimWithSignature(address beneficiary, uint8 numHashes, uint256 seed, uint256 _amount)
        public
    {
        address recipient = address(1);
        vm.assume(recipient.code.length == 0);
        (uint256 amount, bytes32[] memory transactionHashes) = fuzzHelper(_amount, numHashes, seed);
        (bytes memory signature, uint256 chainId, uint128 startBlockNumber, uint128 endBlockNumber) =
            mockSigner(alicePK, address(this), beneficiary, transactionHashes, amount);

        uint256 recipientBalanceBefore = CurrencyLibrary.ADDRESS_ZERO.balanceOf(recipient);

        rebates.claimWithSignature(
            chainId, beneficiary, recipient, amount, BlockNumberRange(startBlockNumber, endBlockNumber), signature
        );

        assertEq(CurrencyLibrary.ADDRESS_ZERO.balanceOf(recipient), recipientBalanceBefore + amount);
    }

    /// @dev test claims where the rebateClaimer is pranked
    function test_signature_claimWithSignature_rebateClaimer(
        address beneficiary,
        uint8 numHashes,
        uint256 seed,
        uint256 _amount
    ) public {
        address recipient = address(1);
        vm.assume(recipient.code.length == 0);
        (uint256 amount, bytes32[] memory transactionHashes) = fuzzHelper(_amount, numHashes, seed);
        (bytes memory signature, uint256 chainId, uint128 startBlockNumber, uint128 endBlockNumber) =
            mockSigner(alicePK, bob, beneficiary, transactionHashes, amount);

        uint256 recipientBalanceBefore = CurrencyLibrary.ADDRESS_ZERO.balanceOf(recipient);

        vm.prank(bob);
        rebates.claimWithSignature(
            chainId, beneficiary, recipient, amount, BlockNumberRange(startBlockNumber, endBlockNumber), signature
        );

        assertEq(CurrencyLibrary.ADDRESS_ZERO.balanceOf(recipient), recipientBalanceBefore + amount);
    }

    /// @dev invalid signature reverts
    function test_signature_invalid_revert(
        uint128 signerPK,
        address beneficiary,
        uint8 numHashes,
        uint256 seed,
        uint256 _amount
    ) public {
        address recipient = address(1);
        vm.assume(0 < signerPK);
        (uint256 amount, bytes32[] memory transactionHashes) = fuzzHelper(_amount, numHashes, seed);

        (bytes memory signature, uint256 chainId, uint128 startBlockNumber, uint128 endBlockNumber) =
            mockSigner(signerPK, address(this), beneficiary, transactionHashes, amount);

        vm.expectRevert(SignatureVerification.InvalidSigner.selector);
        rebates.claimWithSignature(
            chainId, beneficiary, recipient, amount, BlockNumberRange(startBlockNumber, endBlockNumber), signature
        );
    }

    /// @dev re-using a signature reverts on invalid block number
    function test_signature_replay_revert(address beneficiary, uint8 numHashes, uint256 seed, uint256 _amount) public {
        address recipient = address(1);
        vm.assume(recipient.code.length == 0);
        (uint256 amount, bytes32[] memory transactionHashes) = fuzzHelper(_amount, numHashes, seed);
        (bytes memory signature, uint256 chainId, uint128 startBlockNumber, uint128 endBlockNumber) =
            mockSigner(alicePK, address(this), beneficiary, transactionHashes, amount);

        uint256 recipientBalanceBefore = CurrencyLibrary.ADDRESS_ZERO.balanceOf(recipient);

        rebates.claimWithSignature(
            chainId, beneficiary, recipient, amount, BlockNumberRange(startBlockNumber, endBlockNumber), signature
        );
        assertEq(CurrencyLibrary.ADDRESS_ZERO.balanceOf(recipient), recipientBalanceBefore + amount);

        // signature cannot be re-used
        vm.expectRevert(InvalidBlockNumber.selector);
        rebates.claimWithSignature(
            chainId, beneficiary, recipient, amount, BlockNumberRange(startBlockNumber, endBlockNumber), signature
        );
    }

    /// @dev Two valid signatures on block range [100, 150] and [151, 200] is valid
    function test_perfect_block_revert(address beneficiary, uint8 numHashes, uint256 seed, uint256 _amount) public {
        address recipient = address(1);
        vm.assume(recipient.code.length == 0);
        (uint256 amount, bytes32[] memory transactionHashes) = fuzzHelper(_amount, numHashes, seed);
        (bytes memory signature, uint256 chainId, uint128 startBlockNumber, uint128 endBlockNumber) =
            mockSigner(alicePK, address(this), beneficiary, transactionHashes, amount);
        assertEq(startBlockNumber, 100);
        assertEq(endBlockNumber, 150);

        uint256 recipientBalanceBefore = CurrencyLibrary.ADDRESS_ZERO.balanceOf(recipient);

        rebates.claimWithSignature(
            chainId, beneficiary, recipient, amount, BlockNumberRange(startBlockNumber, endBlockNumber), signature
        );
        assertEq(CurrencyLibrary.ADDRESS_ZERO.balanceOf(recipient), recipientBalanceBefore + amount);

        // top up the balance
        vm.deal(address(rebates), amount);

        // a new valid signature with perfect block range
        startBlockNumber = endBlockNumber + 1;
        assertEq(startBlockNumber, 151);
        endBlockNumber = 200;
        bytes32 digest =
            getDigest(address(this), beneficiary, chainId, transactionHashes, startBlockNumber, endBlockNumber, amount);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(alicePK, digest);
        signature = abi.encodePacked(r, s, v);

        rebates.claimWithSignature(
            chainId, beneficiary, recipient, amount, BlockNumberRange(startBlockNumber, endBlockNumber), signature
        );
    }

    /// @dev A valid signature with overlapping blocks will revert
    function test_block_overlap0_revert(address beneficiary, uint8 numHashes, uint256 seed, uint256 _amount) public {
        address recipient = address(1);
        vm.assume(recipient.code.length == 0);
        (uint256 amount, bytes32[] memory transactionHashes) = fuzzHelper(_amount, numHashes, seed);
        (bytes memory signature, uint256 chainId, uint128 startBlockNumber, uint128 endBlockNumber) =
            mockSigner(alicePK, address(this), beneficiary, transactionHashes, amount);

        uint256 recipientBalanceBefore = CurrencyLibrary.ADDRESS_ZERO.balanceOf(recipient);

        rebates.claimWithSignature(
            chainId, beneficiary, recipient, amount, BlockNumberRange(startBlockNumber, endBlockNumber), signature
        );
        assertEq(CurrencyLibrary.ADDRESS_ZERO.balanceOf(recipient), recipientBalanceBefore + amount);

        // a new valid signature with overlapping blocks cannot be used
        startBlockNumber = 149;
        endBlockNumber = 200;
        bytes32 digest =
            getDigest(address(this), beneficiary, chainId, transactionHashes, startBlockNumber, endBlockNumber, amount);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(alicePK, digest);
        signature = abi.encodePacked(r, s, v);

        vm.expectRevert(InvalidBlockNumber.selector);
        rebates.claimWithSignature(
            chainId, beneficiary, recipient, amount, BlockNumberRange(startBlockNumber, endBlockNumber), signature
        );
    }

    /// @dev A valid signature with unordered blocks is invalid
    function test_unordered_blockNumber_revert(
        address beneficiary,
        uint8 numHashes,
        uint256 seed,
        uint256 _amount,
        uint128 startBlockNumber,
        uint128 endBlockNumber
    ) public {
        vm.assume(endBlockNumber < startBlockNumber);
        address recipient = address(1);
        vm.assume(recipient.code.length == 0);
        (uint256 amount, bytes32[] memory transactionHashes) = fuzzHelper(_amount, numHashes, seed);

        uint256 chainId = 1;

        // a new valid signature but unordered block number is invalid
        bytes32 digest =
            getDigest(address(this), beneficiary, chainId, transactionHashes, startBlockNumber, endBlockNumber, amount);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(alicePK, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.expectRevert(InvalidBlockNumber.selector);
        rebates.claimWithSignature(
            chainId, beneficiary, recipient, amount, BlockNumberRange(startBlockNumber, endBlockNumber), signature
        );
    }

    /// @dev test that single block claims cannot be replayed
    function test_revert_singleBlockReplay(
        address beneficiary,
        uint8 numHashes,
        uint256 seed,
        uint256 _amount,
        uint128 startBlockNumber,
        uint256 chainId
    ) public {
        address recipient = address(1);
        vm.assume(startBlockNumber != 0);
        (uint256 amount, bytes32[] memory transactionHashes) = fuzzHelper(_amount, numHashes, seed);

        // generate a valid signature for a single block claim
        uint128 endBlockNumber = startBlockNumber;
        bytes32 digest =
            getDigest(address(this), beneficiary, chainId, transactionHashes, startBlockNumber, endBlockNumber, amount);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(alicePK, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        // successfully claim on a single block
        uint256 recipientBalanceBefore = CurrencyLibrary.ADDRESS_ZERO.balanceOf(recipient);
        rebates.claimWithSignature(
            chainId, beneficiary, recipient, amount, BlockNumberRange(startBlockNumber, endBlockNumber), signature
        );
        assertEq(CurrencyLibrary.ADDRESS_ZERO.balanceOf(recipient), recipientBalanceBefore + amount);

        // top up the balance
        vm.deal(address(rebates), amount);

        // attempt a replay that will revert
        vm.expectRevert(InvalidBlockNumber.selector);
        rebates.claimWithSignature(
            chainId, beneficiary, recipient, amount, BlockNumberRange(startBlockNumber, endBlockNumber), signature
        );
    }

    /// @dev taking more than allowable amount reverts
    function test_amount_revert(address beneficiary, uint8 numHashes, uint256 seed, uint256 _amount) public {
        address recipient = address(1);
        (uint256 amount, bytes32[] memory transactionHashes) = fuzzHelper(_amount, numHashes, seed);
        (bytes memory signature, uint256 chainId, uint128 startBlockNumber, uint128 endBlockNumber) =
            mockSigner(alicePK, address(this), beneficiary, transactionHashes, amount);

        // attempt to claim more than what was signed
        amount = bound(amount, amount + 1, type(uint256).max);

        vm.expectRevert(SignatureVerification.InvalidSigner.selector);
        rebates.claimWithSignature(
            chainId, beneficiary, recipient, amount, BlockNumberRange(startBlockNumber, endBlockNumber), signature
        );
    }

    /// @dev taking more than reward supply reverts
    function test_rewardSupply_revert(address beneficiary, uint8 numHashes, uint256 seed, uint256 _amount) public {
        address recipient = address(1);
        (, bytes32[] memory transactionHashes) = fuzzHelper(_amount, numHashes, seed);

        uint256 amount = bound(_amount, address(rebates).balance + 1, type(uint256).max);

        (bytes memory signature, uint256 chainId, uint128 startBlockNumber, uint128 endBlockNumber) =
            mockSigner(alicePK, address(this), beneficiary, transactionHashes, amount);

        // revert if claiming more than reward supply
        vm.expectRevert();
        vm.prank(beneficiary);
        rebates.claimWithSignature(
            chainId, beneficiary, recipient, amount, BlockNumberRange(startBlockNumber, endBlockNumber), signature
        );
    }

    // --- Helpers --- //
    function getDigest(
        address claimer,
        address beneficiary,
        uint256 chainId,
        bytes32[] memory transactionHashes,
        uint128 startBlockNumber,
        uint128 endBlockNumber,
        uint256 amount
    ) internal view returns (bytes32 digest) {
        // need to keccak256/encodePacked transactionHashes, according to EIP712, as its a dynamic type
        digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                rebates.DOMAIN_SEPARATOR(),
                keccak256(
                    abi.encode(
                        ClaimableHash.CLAIMABLE_TYPEHASH,
                        claimer,
                        beneficiary,
                        chainId,
                        startBlockNumber,
                        endBlockNumber,
                        amount
                    )
                )
            )
        );
    }

    function fuzzHelper(uint256 amount, uint8 numHashes, uint256 seed)
        internal
        view
        returns (uint256, bytes32[] memory)
    {
        vm.assume(0 < numHashes);
        amount = bound(amount, 1 wei, address(rebates).balance);

        // manually generate pseudo random transaction hashes because fuzzer was producing
        // arrays with duplicates
        bytes32[] memory transactionHashes = new bytes32[](numHashes);
        for (uint256 i; i < uint256(numHashes); i++) {
            transactionHashes[i] = keccak256(abi.encode(seed, i));
        }

        return (amount, transactionHashes);
    }

    /// @dev a mock signer that returns a valid signature for claims
    function mockSigner(
        uint256 signerPK,
        address claimer,
        address beneficiary,
        bytes32[] memory transactionHashes,
        uint256 amount // MOCK: backend to calculate this from transactionHash event data
    )
        internal
        view
        returns (bytes memory signature, uint256 chainId, uint128 startBlockNumber, uint128 endBlockNumber)
    {
        // MOCK: backend extracts chainId from transactionHashes
        chainId = 1;

        // MOCK: backend to extract the first and last block number from transactionHashes
        startBlockNumber = 100;
        endBlockNumber = 150; // end block number is INCLUSIVE; so user is claiming for blocks [100, 150]

        // MOCK: backend to verify that beneficiary has specified the claimer
        // require(claimer == IRebateClaimer(beneficiary).rebateClaimer(), "INVALID_CLAIMER");

        bytes32 digest =
            getDigest(claimer, beneficiary, chainId, transactionHashes, startBlockNumber, endBlockNumber, amount);

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerPK, digest);
        signature = abi.encodePacked(r, s, v);
    }
}
