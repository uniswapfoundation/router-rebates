// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import {IERC20} from "forge-std/interfaces/IERC20.sol";
import {MockERC20} from "solmate/src/test/utils/mocks/MockERC20.sol";
import {SignatureVerification} from "permit2/src/libraries/SignatureVerification.sol";

import {ClaimableHash} from "../src/libraries/ClaimableHash.sol";
import {SignatureRebates} from "../src/SignatureRebates.sol";

contract SignatureRebatesTest is Test {
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

    // function test_claimableTypehash() public pure {
    //     assertEq(
    //         ClaimableHash.CLAIMABLE_TYPEHASH,
    //         keccak256("Claimable(address referrer,bytes32 transactionHash,uint256 amountMax)")
    //     );
    // }

    // function test_claimableHash(address referrer, bytes32 transactionHash, uint256 amountMax) public pure {
    //     assertEq(
    //         ClaimableHash.hashClaimable(referrer, transactionHash, amountMax),
    //         keccak256(abi.encode(ClaimableHash.CLAIMABLE_TYPEHASH, referrer, transactionHash, amountMax))
    //     );
    // }

    // function test_signature(
    //     address beneficiary,
    //     bytes32 transactionHash,
    //     uint256 amountMax,
    //     address recipient,
    //     uint256 amountToClaim
    // ) public {
    //     vm.assume(recipient != address(rebates));
    //     (,, uint256 rewardSupply,,) = rebates.campaigns(campaignId);
    //     amountMax = bound(amountMax, 1 wei, rewardSupply);
    //     amountToClaim = bound(amountToClaim, 1 wei, amountMax);

    //     bytes32 digest = getDigest(beneficiary, transactionHash, amountMax);

    //     (uint8 v, bytes32 r, bytes32 s) = vm.sign(alicePK, digest);
    //     bytes memory signature = abi.encodePacked(r, s, v);

    //     uint256 recipientBalanceBefore = token.balanceOf(recipient);

    //     // beneficiary claims the rebate
    //     vm.prank(beneficiary);
    //     rebates.claim(campaignId, recipient, amountToClaim, transactionHash, amountMax, signature);

    //     assertEq(token.balanceOf(recipient), recipientBalanceBefore + amountToClaim);
    // }

    // /// @dev invalid signature reverts
    // function test_signature_invalid_revert(
    //     uint128 signerPK,
    //     address beneficiary,
    //     bytes32 transactionHash,
    //     uint256 amountMax,
    //     address recipient,
    //     uint256 amountToClaim
    // ) public {
    //     vm.assume(recipient != address(rebates));
    //     vm.assume(0 < signerPK);
    //     (,, uint256 rewardSupply,, address owner) = rebates.campaigns(campaignId);
    //     vm.assume(vm.addr(signerPK) != owner); // signer is not campaign owner

    //     amountMax = bound(amountMax, 1 wei, rewardSupply);
    //     amountToClaim = bound(amountToClaim, 1 wei, amountMax);

    //     bytes32 digest = getDigest(beneficiary, transactionHash, amountMax);

    //     (uint8 v, bytes32 r, bytes32 s) = vm.sign(alicePK, digest);
    //     bytes memory signature = abi.encodePacked(r, s, v);

    //     vm.expectRevert(SignatureVerification.InvalidSigner.selector);
    //     rebates.claim(campaignId, recipient, amountToClaim, transactionHash, amountMax, signature);
    // }

    // /// @dev re-using a hash reverts
    // function test_signature_replay_hashUsed_revert(
    //     address beneficiary,
    //     bytes32 transactionHash,
    //     uint256 amountMax,
    //     address recipient,
    //     uint256 amountToClaim
    // ) public {
    //     vm.assume(recipient != address(rebates));
    //     (,, uint256 rewardSupply,,) = rebates.campaigns(campaignId);
    //     amountMax = bound(amountMax, 1 wei, rewardSupply);
    //     amountToClaim = bound(amountToClaim, 1 wei, amountMax);

    //     bytes32 digest = getDigest(beneficiary, transactionHash, amountMax);

    //     (uint8 v, bytes32 r, bytes32 s) = vm.sign(alicePK, digest);
    //     bytes memory signature = abi.encodePacked(r, s, v);

    //     uint256 recipientBalanceBefore = token.balanceOf(recipient);

    //     // beneficiary claims the rebate
    //     vm.prank(beneficiary);
    //     rebates.claim(campaignId, recipient, amountToClaim, transactionHash, amountMax, signature);
    //     assertEq(token.balanceOf(recipient), recipientBalanceBefore + amountToClaim);

    //     // signature cannot be re-used
    //     vm.expectRevert(abi.encodeWithSelector(HashUsed.selector, transactionHash));
    //     vm.prank(beneficiary);
    //     rebates.claim(campaignId, recipient, amountToClaim, transactionHash, amountMax, signature);
    // }

    // /// @dev taking more than allowable amount reverts
    // function test_amount_revert(
    //     address beneficiary,
    //     bytes32 transactionHash,
    //     uint256 amountMax,
    //     address recipient,
    //     uint256 amountToClaim
    // ) public {
    //     vm.assume(recipient != address(rebates));
    //     (,, uint256 rewardSupply,,) = rebates.campaigns(campaignId);
    //     amountMax = bound(amountMax, 1 wei, rewardSupply);
    //     amountToClaim = bound(amountToClaim, 1 wei, type(uint256).max);

    //     bytes32 digest = getDigest(beneficiary, transactionHash, amountMax);

    //     (uint8 v, bytes32 r, bytes32 s) = vm.sign(alicePK, digest);
    //     bytes memory signature = abi.encodePacked(r, s, v);

    //     // revert if amount to claim exceeds the signed amount
    //     if (amountMax < amountToClaim) vm.expectRevert(InvalidAmount.selector);
    //     vm.prank(beneficiary);
    //     rebates.claim(campaignId, recipient, amountToClaim, transactionHash, amountMax, signature);
    // }

    // /// @dev taking more than reward supply reverts
    // function test_rewardSupply_revert(
    //     address beneficiary,
    //     bytes32 transactionHash,
    //     uint256 amountMax,
    //     address recipient,
    //     uint256 amountToClaim
    // ) public {
    //     vm.assume(recipient != address(rebates));
    //     (,, uint256 rewardSupply,,) = rebates.campaigns(campaignId);
    //     amountMax = bound(amountMax, rewardSupply + 1, type(uint256).max);
    //     amountToClaim = bound(amountToClaim, rewardSupply + 1, amountMax);

    //     bytes32 digest = getDigest(beneficiary, transactionHash, amountMax);

    //     (uint8 v, bytes32 r, bytes32 s) = vm.sign(alicePK, digest);
    //     bytes memory signature = abi.encodePacked(r, s, v);

    //     // revert if claiming more than reward supply
    //     vm.expectRevert();
    //     vm.prank(beneficiary);
    //     rebates.claim(campaignId, recipient, amountToClaim, transactionHash, amountMax, signature);
    // }

    // // --- Helpers --- //
    // function getDigest(address referrer, bytes32 transactionHash, uint256 amountMax)
    //     internal
    //     view
    //     returns (bytes32 digest)
    // {
    //     digest = keccak256(
    //         abi.encodePacked(
    //             "\x19\x01",
    //             rebates.DOMAIN_SEPARATOR(),
    //             keccak256(abi.encode(ClaimableHash.CLAIMABLE_TYPEHASH, referrer, transactionHash, amountMax))
    //         )
    //     );
    // }
}
