// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import {Currency} from "v4-core/src/types/Currency.sol";
import {IERC20} from "forge-std/interfaces/IERC20.sol";
import {IHooks} from "v4-core/src/interfaces/IHooks.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {PoolManager} from "v4-core/src/PoolManager.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {PoolModifyLiquidityTest} from "v4-core/src/test/PoolModifyLiquidityTest.sol";
import {PoolSwapTest} from "v4-core/src/test/PoolSwapTest.sol";
import {PoolDonateTest} from "v4-core/src/test/PoolDonateTest.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {MockERC20} from "solmate/src/test/utils/mocks/MockERC20.sol";
import {Constants} from "v4-core/src/../test/utils/Constants.sol";
import {TickMath} from "v4-core/src/libraries/TickMath.sol";
import {CurrencyLibrary, Currency} from "v4-core/src/types/Currency.sol";

import {RouterRebates} from "../src/RouterRebates.sol";
import {PoolSwapTestClaimable} from "../src/test/PoolSwapTestClaimable.sol";
import {Counter} from "./mocks/Counter.sol";
import {HookMiner} from "../test/utils/HookMiner.sol";

contract DeployRouterRebatesScript is Script {
    function setUp() public {}

    function run() public {
        vm.broadcast();
        RouterRebates rebates = new RouterRebates(
            "FOUNDATION",
            address(0x70997970C51812dc3A010C7d01b50e0d17dc79C8),
            address(0x70997970C51812dc3A010C7d01b50e0d17dc79C8)
        );

        vm.broadcast();
        (bool success,) = address(rebates).call{value: 0.02 ether}("");
        require(success, "Failed to send ether to RouterRebates contract");
    }
}
