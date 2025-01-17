// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {SignatureRebates} from "../SignatureRebates.sol";
import {PoolSwapTest} from "v4-core/src/test/PoolSwapTest.sol";
import {IRebateClaimer} from "../base/IRebateClaimer.sol";

contract PoolSwapTestClaimable is PoolSwapTest, IRebateClaimer {
    constructor(IPoolManager _manager, SignatureRebates _rebates) PoolSwapTest(_manager) {}

    function rebateClaimer() external pure override returns (address) {
        return address(0x70997970C51812dc3A010C7d01b50e0d17dc79C8);
    }
}
