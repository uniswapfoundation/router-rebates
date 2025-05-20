// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {PoolSwapTest} from "v4-core/src/test/PoolSwapTest.sol";
import {IRebateClaimer} from "../base/IRebateClaimer.sol";

contract PoolSwapTestClaimable is PoolSwapTest, IRebateClaimer {
    address public override rebateClaimer;

    constructor(IPoolManager _manager) PoolSwapTest(_manager) {}

    function setClaimer(address _claimer) public {
        rebateClaimer = _claimer;
    }
}
