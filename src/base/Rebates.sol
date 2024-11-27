// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import {Currency} from "v4-core/src/types/Currency.sol";
import {IERC20} from "forge-std/interfaces/IERC20.sol";

struct CampaignInfo {
    uint256 gasPerSwap;
    uint256 maxGasPerHook;
    uint256 rewardSupply;
    Currency token;
    address owner;
}

contract Rebates {
    uint256 public nextCampaignId;

    mapping(uint256 id => CampaignInfo info) public campaigns;

    function createCampaign(address owner, Currency token, uint256 gasPerSwap, uint256 maxGasPerHook)
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

    function deposit(uint256 campaignId, uint256 amount) external payable {
        CampaignInfo storage campaign = campaigns[campaignId];
        campaign.rewardSupply += amount;

        // TODO: safeTransferFrom
        if (campaign.token.isAddressZero()) {
            require(msg.value == amount, "Rebates: incorrect amount");
        } else {
            IERC20(Currency.unwrap(campaign.token)).transferFrom(msg.sender, address(this), amount);
        }
    }

    function _claim(uint256 campaignId, uint256 amount, address recipient) internal {
        CampaignInfo storage campaign = campaigns[campaignId];
        campaign.rewardSupply -= amount;
        campaign.token.transfer(recipient, amount);
    }
}
