// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import {IERC20} from "forge-std/interfaces/IERC20.sol";

struct CampaignInfo {
    uint256 gasPerSwap;
    uint256 maxGasPerHook;
    uint256 rewardSupply;
    IERC20 token;
}

contract Rebates {
    uint256 public nextCampaignId;

    mapping(uint256 id => CampaignInfo info) public campaigns;
    mapping(address referrer => mapping(uint256 id => uint256 rewards)) public claimable;

    function createCampaign(IERC20 token, uint256 gasPerSwap, uint256 maxGasPerHook) external {
        campaigns[nextCampaignId++] =
            CampaignInfo({gasPerSwap: gasPerSwap, maxGasPerHook: maxGasPerHook, rewardSupply: 0, token: token});
    }

    // TODO: allow for tuning
    function updateCampaign(uint256 gasPerSwap, uint256 maxGasPerHook) external {}

    function deposit(uint256 campaignId, uint256 amount) external {
        CampaignInfo storage campaign = campaigns[campaignId];
        campaign.rewardSupply += amount;

        // TODO: safeTransferFrom
        campaign.token.transferFrom(msg.sender, address(this), amount);
    }

    function _claim(uint256 campaignId, address referrer, address destination, uint256 amount) internal {
        claimable[referrer][campaignId] -= amount;

        // send amount to destination
        CampaignInfo storage campaign = campaigns[campaignId];
        campaign.rewardSupply -= amount;
        campaign.token.transfer(destination, amount);
    }
}
