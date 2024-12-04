// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import {Currency, CurrencyLibrary} from "v4-core/src/types/Currency.sol";
import {IERC20} from "forge-std/interfaces/IERC20.sol";
import {MockERC20} from "solmate/src/test/utils/mocks/MockERC20.sol";
import {SignatureVerification} from "permit2/src/libraries/SignatureVerification.sol";

import {ClaimableHash} from "../src/libraries/ClaimableHash.sol";
import {SignatureRebates} from "../src/SignatureRebates.sol";
import {IRebateClaimer} from "../src/base/IRebateClaimer.sol";

contract SignatureRebatesBatchTest is Test {
    MockERC20 public token;
    SignatureRebates public rebates;
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
        token = new MockERC20("TOKEN", "TKN", 18);
        rebates = new SignatureRebates("REBATES", address(this));

        (alice, alicePK) = makeAddrAndKey("ALICE");
        (bob, bobPK) = makeAddrAndKey("BOB");

        uint256 tokenAmount = 10_000e18;
        token.mint(address(this), tokenAmount);
        token.approve(address(rebates), tokenAmount);

        // TODO: create & deposit
        campaignId = rebates.createCampaign(alice, Currency.wrap(address(token)), 60_000, 10_000);
        rebates.deposit(campaignId, tokenAmount);

        nativeEthCampaignId = rebates.createCampaign(alice, CurrencyLibrary.ADDRESS_ZERO, 80_000, 2_000);
        rebates.deposit{value: 10 ether}(nativeEthCampaignId, 10 ether);
    }

    function test_claimableBatchTypehash() public pure {
        assertEq(
            ClaimableHash.CLAIMABLE_TYPEHASH,
            keccak256(
                "Claimable(uint256 campaignId,address claimer,address beneficiary,bytes32[] transactionHashes,uint256 lastBlockNumber,uint256 amount)"
            )
        );
    }

    function test_claimableBatchHash(
        uint256 _campaignId,
        address claimer,
        address beneficiary,
        bytes32[] calldata transactionHashes,
        uint256 lastBlockNumber,
        uint256 amount
    ) public pure {
        assertEq(
            ClaimableHash.hashClaimable(_campaignId, claimer, beneficiary, transactionHashes, lastBlockNumber, amount),
            keccak256(
                abi.encode(
                    ClaimableHash.CLAIMABLE_TYPEHASH,
                    _campaignId,
                    claimer,
                    beneficiary,
                    keccak256(abi.encodePacked(transactionHashes)),
                    lastBlockNumber,
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
        (uint256 amount, bytes32[] memory transactionHashes, uint256 lastBlockNumber,) =
            fuzzHelper(campaignId, beneficiary, recipient, _amount, numHashes, seed);
        bytes memory signature = mockSigner(alicePK, campaignId, address(this), beneficiary, transactionHashes, amount);

        uint256 recipientBalanceBefore = token.balanceOf(recipient);

        rebates.claimWithSignature(
            campaignId, beneficiary, recipient, amount, transactionHashes, lastBlockNumber, signature
        );

        assertEq(token.balanceOf(recipient), recipientBalanceBefore + amount);
    }

    /// @dev test claims where the rebateClaimer is pranked
    function test_signature_claimWithSignature_rebateClaimer(
        address beneficiary,
        uint8 numHashes,
        uint256 seed,
        uint256 _amount,
        address recipient
    ) public {
        (uint256 amount, bytes32[] memory transactionHashes, uint256 lastBlockNumber,) =
            fuzzHelper(campaignId, beneficiary, recipient, _amount, numHashes, seed);
        bytes memory signature = mockSigner(alicePK, campaignId, bob, beneficiary, transactionHashes, amount);

        uint256 recipientBalanceBefore = token.balanceOf(recipient);

        vm.prank(bob);
        rebates.claimWithSignature(
            campaignId, beneficiary, recipient, amount, transactionHashes, lastBlockNumber, signature
        );

        assertEq(token.balanceOf(recipient), recipientBalanceBefore + amount);
    }

    function test_signature_claimBatch_nativeETH(address beneficiary, uint8 numHashes, uint256 seed, uint256 _amount)
        public
    {
        address recipient = address(1); // do not fuzz recipient because fuzzed addresses may not have receive function
        (uint256 amount, bytes32[] memory transactionHashes, uint256 lastBlockNumber,) =
            fuzzHelper(nativeEthCampaignId, beneficiary, recipient, _amount, numHashes, seed);
        vm.assume(amount < address(rebates).balance);

        bytes memory signature =
            mockSigner(alicePK, nativeEthCampaignId, address(this), beneficiary, transactionHashes, amount);

        uint256 recipientBalanceBefore = CurrencyLibrary.ADDRESS_ZERO.balanceOf(recipient);

        rebates.claimWithSignature(
            nativeEthCampaignId, beneficiary, recipient, amount, transactionHashes, lastBlockNumber, signature
        );

        assertEq(CurrencyLibrary.ADDRESS_ZERO.balanceOf(recipient), recipientBalanceBefore + amount);
    }

    /// @dev invalid signature reverts
    function test_signature_invalid_revert(
        uint128 signerPK,
        address beneficiary,
        uint8 numHashes,
        uint256 seed,
        uint256 _amount,
        address recipient
    ) public {
        vm.assume(0 < signerPK);
        (uint256 amount, bytes32[] memory transactionHashes, uint256 lastBlockNumber, bytes32 digest) =
            fuzzHelper(campaignId, recipient, recipient, _amount, numHashes, seed);

        bytes memory signature = mockSigner(signerPK, campaignId, address(this), beneficiary, transactionHashes, amount);

        vm.expectRevert(SignatureVerification.InvalidSigner.selector);
        rebates.claimWithSignature(
            campaignId, beneficiary, recipient, amount, transactionHashes, lastBlockNumber, signature
        );
    }

    /// @dev re-using a hash reverts
    function test_signature_replay_hashUsed_revert(
        address beneficiary,
        uint8 numHashes,
        uint256 seed,
        uint256 _amount,
        address recipient
    ) public {
        (uint256 amount, bytes32[] memory transactionHashes, uint256 lastBlockNumber,) =
            fuzzHelper(campaignId, beneficiary, recipient, _amount, numHashes, seed);
        bytes memory signature = mockSigner(alicePK, campaignId, address(this), beneficiary, transactionHashes, amount);

        uint256 recipientBalanceBefore = token.balanceOf(recipient);

        rebates.claimWithSignature(
            campaignId, beneficiary, recipient, amount, transactionHashes, lastBlockNumber, signature
        );
        assertEq(token.balanceOf(recipient), recipientBalanceBefore + amount);

        // signature cannot be re-used
        vm.expectRevert(InvalidBlockNumber.selector);
        rebates.claimWithSignature(
            campaignId, beneficiary, recipient, amount, transactionHashes, lastBlockNumber, signature
        );
    }

    /// @dev taking more than allowable amount reverts
    function test_amount_revert(address beneficiary, uint8 numHashes, uint256 seed, uint256 _amount, address recipient)
        public
    {
        (uint256 amount, bytes32[] memory transactionHashes, uint256 lastBlockNumber,) =
            fuzzHelper(campaignId, beneficiary, recipient, _amount, numHashes, seed);
        bytes memory signature = mockSigner(alicePK, campaignId, address(this), beneficiary, transactionHashes, amount);

        // attempt to claim more than what was signed
        amount = bound(amount, amount + 1, type(uint256).max);

        vm.expectRevert(SignatureVerification.InvalidSigner.selector);
        rebates.claimWithSignature(
            campaignId, beneficiary, recipient, amount, transactionHashes, lastBlockNumber, signature
        );
    }

    /// @dev taking more than reward supply reverts
    function test_rewardSupply_revert(
        address beneficiary,
        uint8 numHashes,
        uint256 seed,
        uint256 _amount,
        address recipient
    ) public {
        (, bytes32[] memory transactionHashes, uint256 lastBlockNumber,) =
            fuzzHelper(campaignId, beneficiary, recipient, _amount, numHashes, seed);

        (,, uint256 rewardSupply,,) = rebates.campaigns(campaignId);
        uint256 amount = bound(_amount, rewardSupply + 1, type(uint256).max);

        bytes memory signature = mockSigner(alicePK, campaignId, address(this), beneficiary, transactionHashes, amount);

        // revert if claiming more than reward supply
        vm.expectRevert();
        vm.prank(beneficiary);
        rebates.claimWithSignature(
            campaignId, beneficiary, recipient, amount, transactionHashes, lastBlockNumber, signature
        );
    }

    // --- Helpers --- //
    function getDigest(
        uint256 _campaignId,
        address claimer,
        address beneficiary,
        bytes32[] memory transactionHashes,
        uint256 lastBlockNumber,
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
                        _campaignId,
                        claimer,
                        beneficiary,
                        keccak256(abi.encodePacked(transactionHashes)),
                        lastBlockNumber,
                        amount
                    )
                )
            )
        );
    }

    function fuzzHelper(
        uint256 campaign,
        address beneficiary,
        address recipient,
        uint256 amount,
        uint8 numHashes,
        uint256 seed
    ) internal view returns (uint256, bytes32[] memory, uint256, bytes32) {
        vm.assume(0 < numHashes);
        vm.assume(recipient != address(rebates));
        (,, uint256 rewardSupply,,) = rebates.campaigns(campaign);
        amount = bound(amount, 1 wei, rewardSupply);

        // manually generate pseudo random transaction hashes because fuzzer was producing
        // arrays with duplicates
        bytes32[] memory transactionHashes = new bytes32[](numHashes);
        for (uint256 i; i < uint256(numHashes); i++) {
            transactionHashes[i] = keccak256(abi.encode(seed, i));
        }

        bytes32 digest = getDigest(campaign, address(this), beneficiary, transactionHashes, block.number, amount);
        return (amount, transactionHashes, block.number, digest);
    }

    /// @dev a mock signer that returns a valid signature for claims
    function mockSigner(
        uint256 signerPK,
        uint256 _campaignId,
        address claimer,
        address beneficiary,
        bytes32[] memory transactionHashes,
        uint256 amount // MOCK: backend to calculate this from transactionHash event data
    ) internal view returns (bytes memory signature) {
        // MOCK: backend to extract the lastBlockNumber from transactionHashes
        uint256 lastBlockNumber = block.number;

        // MOCK: backend to verify that beneficiary has specified the claimer
        // require(claimer == IRebateClaimer(beneficiary).rebateClaimer(), "INVALID_CLAIMER");

        bytes32 digest = getDigest(_campaignId, claimer, beneficiary, transactionHashes, lastBlockNumber, amount);

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerPK, digest);
        signature = abi.encodePacked(r, s, v);
    }
}
