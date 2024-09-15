// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import {IERC20} from "forge-std/interfaces/IERC20.sol";

struct CampaignInfo {
    uint256 gasPerSwap;
    uint256 maxGasPerHook;
    uint256 rewardSupply;
    IERC20 token;
    address owner;
}

contract Rebates {
    uint256 public nextCampaignId;

    mapping(uint256 id => CampaignInfo info) public campaigns;

    function createCampaign(address owner, IERC20 token, uint256 gasPerSwap, uint256 maxGasPerHook)
        external
        returns (uint256 _campaignId)
    {
        _campaignId = nextCampaignId++;
        campaigns[_campaignId] = CampaignInfo({
            gasPerSwap: gasPerSwap,
            maxGasPerHook: maxGasPerHook,
            rewardSupply: 0,
            token: token,
            owner: owner
        });
    }

    // TODO: allow for tuning
    function updateCampaign(uint256 gasPerSwap, uint256 maxGasPerHook) external {}

    function deposit(uint256 campaignId, uint256 amount) external {
        CampaignInfo storage campaign = campaigns[campaignId];
        campaign.rewardSupply += amount;

        // TODO: safeTransferFrom
        campaign.token.transferFrom(msg.sender, address(this), amount);
    }

    function _claim(uint256 campaignId, uint256 amount, address recipient) internal {
        CampaignInfo storage campaign = campaigns[campaignId];
        campaign.rewardSupply -= amount;
        campaign.token.transfer(recipient, amount);
    }
}
