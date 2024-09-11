// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

contract Rebates {
    uint256 public gasPerSwap;
    uint256 public maxGasPerHook;

    mapping(address user => uint256 rewards) public claimable;

    function deposit() external payable {}

    function claim(address destination, uint256 amount) external {
        claimable[msg.sender] -= amount;

        // send amount to destination
    }

    function _boostForHook(address referrer) internal {}
}