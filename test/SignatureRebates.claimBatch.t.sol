// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import {IERC20} from "forge-std/interfaces/IERC20.sol";
import {MockERC20} from "solmate/src/test/utils/mocks/MockERC20.sol";
import {SignatureVerification} from "permit2/src/libraries/SignatureVerification.sol";

import {ClaimableHash} from "../src/libraries/ClaimableHash.sol";
import {SignatureRebates} from "../src/SignatureRebates.sol";

contract SignatureRebatesBatchTest is Test {
    MockERC20 public token;
    SignatureRebates public rebates;
    uint256 campaignId;

    address alice;
    uint256 alicePK;

    address bob;
    uint256 bobPK;

    // TODO: use ISignatureRebate
    error HashUsed(bytes32 txnHash);
    error InvalidAmount();

    function setUp() public {
        token = new MockERC20("TOKEN", "TKN", 18);
        rebates = new SignatureRebates("REBATES", address(this));

        (alice, alicePK) = makeAddrAndKey("ALICE");
        (bob, bobPK) = makeAddrAndKey("BOB");

        uint256 tokenAmount = 10_000e18;
        token.mint(address(this), tokenAmount);
        token.approve(address(rebates), tokenAmount);

        // TODO: create & deposit
        campaignId = rebates.createCampaign(alice, IERC20(address(token)), 60_000, 10_000);
        rebates.deposit(campaignId, tokenAmount);
    }

    function test_claimableBatchTypehash() public pure {
        assertEq(
            ClaimableHash.CLAIMABLE_BATCH_TYPEHASH,
            keccak256("ClaimableBatch(uint256 campaignId,address referrer,bytes32[] transactionHashes,uint256 amount)")
        );
    }

    function test_claimableBatchHash(
        uint256 _campaignId,
        address referrer,
        bytes32[] calldata transactionHashes,
        uint256 amount
    ) public pure {
        assertEq(
            ClaimableHash.hashClaimableBatch(_campaignId, referrer, transactionHashes, amount),
            keccak256(
                abi.encode(
                    ClaimableHash.CLAIMABLE_BATCH_TYPEHASH,
                    _campaignId,
                    referrer,
                    keccak256(abi.encodePacked(transactionHashes)),
                    amount
                )
            )
        );
    }

    function test_signature_claimBatch(
        address beneficiary,
        uint8 numHashes,
        uint256 seed,
        uint256 _amount,
        address recipient
    ) public {
        (uint256 amount, bytes32[] memory transactionHashes, bytes32 digest) =
            fuzzHelper(beneficiary, recipient, _amount, numHashes, seed);

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(alicePK, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        uint256 recipientBalanceBefore = token.balanceOf(recipient);

        // beneficiary claims the rebate
        vm.prank(beneficiary);
        rebates.claimBatch(campaignId, recipient, amount, transactionHashes, signature);

        assertEq(token.balanceOf(recipient), recipientBalanceBefore + amount);
    }

    /// @dev invalid signature reverts
    function test_signature_invalid_revert(
        uint128 signerPK,
        uint8 numHashes,
        uint256 seed,
        uint256 _amount,
        address recipient
    ) public {
        vm.assume(0 < signerPK);
        (uint256 amount, bytes32[] memory transactionHashes, bytes32 digest) =
            fuzzHelper(recipient, recipient, _amount, numHashes, seed);

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(alicePK, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.expectRevert(SignatureVerification.InvalidSigner.selector);
        rebates.claimBatch(campaignId, recipient, amount, transactionHashes, signature);
    }

    /// @dev re-using a hash reverts
    function test_signature_replay_hashUsed_revert(
        address beneficiary,
        uint8 numHashes,
        uint256 seed,
        uint256 _amount,
        address recipient
    ) public {
        (uint256 amount, bytes32[] memory transactionHashes, bytes32 digest) =
            fuzzHelper(beneficiary, recipient, _amount, numHashes, seed);

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(alicePK, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        uint256 recipientBalanceBefore = token.balanceOf(recipient);

        // beneficiary claims the rebate
        vm.prank(beneficiary);
        rebates.claimBatch(campaignId, recipient, amount, transactionHashes, signature);
        assertEq(token.balanceOf(recipient), recipientBalanceBefore + amount);

        // signature cannot be re-used
        vm.expectRevert(abi.encodeWithSelector(HashUsed.selector, transactionHashes[0]));
        vm.prank(beneficiary);
        rebates.claimBatch(campaignId, recipient, amount, transactionHashes, signature);
    }

    /// @dev taking more than allowable amount reverts
    function test_amount_revert(address beneficiary, uint8 numHashes, uint256 seed, uint256 _amount, address recipient)
        public
    {
        (uint256 amount, bytes32[] memory transactionHashes, bytes32 digest) =
            fuzzHelper(beneficiary, recipient, _amount, numHashes, seed);

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(alicePK, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        // attempt to claim more than what was signed
        amount = bound(amount, amount + 1, type(uint256).max);

        vm.expectRevert(SignatureVerification.InvalidSigner.selector);
        vm.prank(beneficiary);
        rebates.claimBatch(campaignId, recipient, amount, transactionHashes, signature);
    }

    /// @dev taking more than reward supply reverts
    function test_rewardSupply_revert(
        address beneficiary,
        uint8 numHashes,
        uint256 seed,
        uint256 _amount,
        address recipient
    ) public {
        (, bytes32[] memory transactionHashes,) = fuzzHelper(beneficiary, recipient, _amount, numHashes, seed);

        (,, uint256 rewardSupply,,) = rebates.campaigns(campaignId);
        uint256 amount = bound(_amount, rewardSupply + 1, type(uint256).max);

        bytes32 digest = getDigest(campaignId, beneficiary, transactionHashes, amount);

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(alicePK, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        // revert if claiming more than reward supply
        vm.expectRevert();
        vm.prank(beneficiary);
        rebates.claimBatch(campaignId, recipient, amount, transactionHashes, signature);
    }

    // --- Helpers --- //
    function getDigest(uint256 _campaignId, address referrer, bytes32[] memory transactionHashes, uint256 amount)
        internal
        view
        returns (bytes32 digest)
    {
        // need to keccak256/encodePacked transactionHashes, according to EIP712, as its a dynamic type
        digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                rebates.DOMAIN_SEPARATOR(),
                keccak256(
                    abi.encode(
                        ClaimableHash.CLAIMABLE_BATCH_TYPEHASH,
                        _campaignId,
                        referrer,
                        keccak256(abi.encodePacked(transactionHashes)),
                        amount
                    )
                )
            )
        );
    }

    function fuzzHelper(address beneficiary, address recipient, uint256 amount, uint8 numHashes, uint256 seed)
        internal
        view
        returns (uint256, bytes32[] memory, bytes32)
    {
        vm.assume(0 < numHashes);
        vm.assume(recipient != address(rebates));
        (,, uint256 rewardSupply,,) = rebates.campaigns(campaignId);
        amount = bound(amount, 1 wei, rewardSupply);

        // manually generate pseudo random transaction hashes because fuzzer was producing
        // arrays with duplicates
        bytes32[] memory transactionHashes = new bytes32[](numHashes);
        for (uint256 i; i < uint256(numHashes); i++) {
            transactionHashes[i] = keccak256(abi.encode(seed, i));
        }

        bytes32 digest = getDigest(campaignId, beneficiary, transactionHashes, amount);
        return (amount, transactionHashes, digest);
    }
}
