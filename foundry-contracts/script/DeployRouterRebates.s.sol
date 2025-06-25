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
            address(0x7946F621399a3E443d03eFe7e83294B111f0B474),
            address(0x71c3fC03c7bC2EBCFEba197D68205664c2f4dD54)
        );

        // vm.broadcast();
        // (bool success,) = address(rebates).call{value: 0.05 ether}("");
        // require(success, "Failed to send ether to RouterRebates contract");
    }
}
