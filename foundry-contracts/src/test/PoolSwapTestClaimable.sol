// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {SignatureRebates} from "../SignatureRebates.sol";
import {PoolSwapTest} from "v4-core/src/test/PoolSwapTest.sol";
import {Claimooor} from "../base/Claimooor.sol";

contract PoolSwapTestClaimable is PoolSwapTest, Claimooor {
    constructor(IPoolManager _manager, SignatureRebates _rebates) PoolSwapTest(_manager) Claimooor(_rebates) {}
}
