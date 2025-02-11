// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {IERC20} from "forge-std/interfaces/IERC20.sol";
import {IHooks} from "v4-core/src/interfaces/IHooks.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {TickMath} from "v4-core/src/libraries/TickMath.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {BalanceDelta} from "v4-core/src/types/BalanceDelta.sol";
import {PoolId, PoolIdLibrary} from "v4-core/src/types/PoolId.sol";
import {CurrencyLibrary, Currency} from "v4-core/src/types/Currency.sol";
import {StateLibrary} from "v4-core/src/libraries/StateLibrary.sol";

import {LiquidityAmounts} from "v4-core/test/utils/LiquidityAmounts.sol";
import {IPositionManager} from "v4-periphery/src/interfaces/IPositionManager.sol";
import {EasyPosm} from "../utils/EasyPosm.sol";
import {Fixtures} from "../utils/Fixtures.sol";

import {MinimalRouter, MinimalRouterWithSnapshot} from "../utils/MinimalRouter.sol";

contract MinimalRouterTest is Test, Fixtures {
    using EasyPosm for IPositionManager;
    using PoolIdLibrary for PoolKey;
    using CurrencyLibrary for Currency;
    using StateLibrary for IPoolManager;

    PoolId poolId;

    uint256 tokenId;
    int24 currentTick;
    int24 tickLower;
    int24 tickUpper;

    MinimalRouter minRouter;
    MinimalRouterWithSnapshot minRouterWithSnapshot;

    function setUp() public {
        // creates the pool manager, utility routers, and test tokens
        deployFreshManagerAndRouters();
        deployMintAndApprove2Currencies();

        deployAndApprovePosm(manager);

        minRouter = new MinimalRouter(manager);
        minRouterWithSnapshot = new MinimalRouterWithSnapshot(manager);
        IERC20(Currency.unwrap(currency0)).approve(address(minRouter), type(uint256).max);
        IERC20(Currency.unwrap(currency1)).approve(address(minRouter), type(uint256).max);
        IERC20(Currency.unwrap(currency0)).approve(address(minRouterWithSnapshot), type(uint256).max);
        IERC20(Currency.unwrap(currency1)).approve(address(minRouterWithSnapshot), type(uint256).max);

        // Create the pool
        key = PoolKey(currency0, currency1, 3000, 60, IHooks(address(0)));
        poolId = key.toId();
        manager.initialize(key, SQRT_PRICE_1_1);
        currentTick = TickMath.getTickAtSqrtPrice(SQRT_PRICE_1_1);
        assertEq(currentTick, 0);

        // Provide full-range liquidity to the pool
        tickLower = TickMath.minUsableTick(key.tickSpacing);
        tickUpper = TickMath.maxUsableTick(key.tickSpacing);

        uint128 liquidityAmount = 100e18;

        (uint256 amount0Expected, uint256 amount1Expected) = LiquidityAmounts.getAmountsForLiquidity(
            SQRT_PRICE_1_1,
            TickMath.getSqrtPriceAtTick(tickLower),
            TickMath.getSqrtPriceAtTick(tickUpper),
            liquidityAmount
        );

        (tokenId,) = posm.mint(
            key,
            tickLower,
            tickUpper,
            liquidityAmount,
            amount0Expected + 1,
            amount1Expected + 1,
            address(this),
            block.timestamp,
            ZERO_BYTES
        );

        // Provide full-range liquidity to the pool
        tickLower = -60;
        tickUpper = 60;

        liquidityAmount = 100e18;

        (amount0Expected, amount1Expected) = LiquidityAmounts.getAmountsForLiquidity(
            SQRT_PRICE_1_1,
            TickMath.getSqrtPriceAtTick(tickLower),
            TickMath.getSqrtPriceAtTick(tickUpper),
            liquidityAmount
        );

        (tokenId,) = posm.mint(
            key,
            tickLower,
            tickUpper,
            liquidityAmount,
            amount0Expected + 1,
            amount1Expected + 1,
            address(this),
            block.timestamp,
            ZERO_BYTES
        );

        // Provide full-range liquidity to the pool
        tickLower = -120;
        tickUpper = 120;

        liquidityAmount = 100e18;

        (amount0Expected, amount1Expected) = LiquidityAmounts.getAmountsForLiquidity(
            SQRT_PRICE_1_1,
            TickMath.getSqrtPriceAtTick(tickLower),
            TickMath.getSqrtPriceAtTick(tickUpper),
            liquidityAmount
        );

        (tokenId,) = posm.mint(
            key,
            tickLower,
            tickUpper,
            liquidityAmount,
            amount0Expected + 1,
            amount1Expected + 1,
            address(this),
            block.timestamp,
            ZERO_BYTES
        );
    }

    // snapshot zeroForOne, exactInput, 0 ticks crossed
    function test_gas_swapCall_zeroForOne_exactInput_withinTick() public {
        snap_swapCall(true, true, 0);
    }

    // snapshot oneForZero, exactInput, 0 ticks crossed
    function test_gas_swapCall_oneForZero_exactInput_withinTick() public {
        snap_swapCall(false, true, 0);
    }

    // snapshot zeroForOne, exactOutput, 0 ticks crossed
    function test_gas_swapCall_zeroForOne_exactOutput_withinTick() public {
        snap_swapCall(true, false, 0);
    }

    // snapshot oneForZero, exactOutput, 0 ticks crossed
    function test_gas_swapCall_oneForZero_exactOutput_withinTick() public {
        snap_swapCall(false, false, 0);
    }

    // --------------------------

    // snapshot zeroForOne, exactInput, 1 tick crossed
    function test_gas_swapCall_zeroForOne_exactInput_crossOneTick() public {
        snap_swapCall(true, true, 1);
    }

    // snapshot oneForZero, exactInput, 1 tick crossed
    function test_gas_swapCall_oneForZero_exactInput_crossOneTick() public {
        snap_swapCall(false, true, 1);
    }

    // snapshot zeroForOne, exactOutput, 1 tick crossed
    function test_gas_swapCall_zeroForOne_exactOutput_crossOneTick() public {
        snap_swapCall(true, false, 1);
    }

    // snapshot oneForZero, exactOutput, 1 tick crossed
    function test_gas_swapCall_oneForZero_exactOutput_crossOneTick() public {
        snap_swapCall(false, false, 1);
    }

    // --------------------------

    // snapshot zeroForOne, exactInput, 2 ticks crossed
    function test_gas_swapCall_zeroForOne_exactInput_crossTwoTicks() public {
        snap_swapCall(true, true, 2);
    }

    // snapshot oneForZero, exactInput, 2 ticks crossed
    function test_gas_swapCall_oneForZero_exactInput_crossTwoTicks() public {
        snap_swapCall(false, true, 2);
    }

    // snapshot zeroForOne, exactOutput, 2 ticks crossed
    function test_gas_swapCall_zeroForOne_exactOutput_crossTwoTicks() public {
        snap_swapCall(true, false, 2);
    }

    // snapshot oneForZero, exactOutput, 2 ticks crossed
    function test_gas_swapCall_oneForZero_exactOutput_crossTwoTicks() public {
        snap_swapCall(false, false, 2);
    }

    // --------------------------

    // snapshot zeroForOne, exactInput, 5 ticks crossed
    function test_gas_swapCall_zeroForOne_crossFiveTicks() public {
        snap_swapCall(true, true, 5);
    }

    // snapshot oneForZero, exactInput, 5 ticks crossed
    function test_gas_swapCall_oneForZero_crossFiveTicks() public {
        snap_swapCall(false, true, 5);
    }

    // snapshot zeroForOne, exactOutput, 5 ticks crossed
    function test_gas_swapCall_zeroForOne_exactOutput_crossFiveTicks() public {
        snap_swapCall(true, false, 5);
    }

    // snapshot oneForZero, exactOutput, 5 ticks crossed
    function test_gas_swapCall_oneForZero_exactOutput_crossFiveTicks() public {
        snap_swapCall(false, false, 5);
    }

    // --------------------------

    // snapshot zeroForOne, exactInput, 61 ticks crossed
    function test_gas_swapCall_zeroForOne_crossSixtyOneTicks() public {
        snap_swapCall(true, true, 61);
    }

    // snapshot oneForZero, exactInput, 61 ticks crossed
    function test_gas_swapCall_oneForZero_crossSixtyOneTicks() public {
        snap_swapCall(false, true, 61);
    }

    // snapshot zeroForOne, exactOutput, 61 ticks crossed
    function test_gas_swapCall_zeroForOne_exactOutput_crossSixtyOneTicks() public {
        snap_swapCall(true, false, 61);
    }

    // snapshot oneForZero, exactOutput, 61 ticks crossed
    function test_gas_swapCall_oneForZero_exactOutput_crossSixtyOneTicks() public {
        snap_swapCall(false, false, 61);
    }

    // --------------------------

    // snapshot zeroForOne, exactInput, 121 ticks crossed
    function test_gas_swapCall_zeroForOne_crossOneHundredTwentyOneTicks() public {
        snap_swapCall(true, true, 121);
    }

    // snapshot oneForZero, exactInput, 121 ticks crossed
    function test_gas_swapCall_oneForZero_crossOneHundredTwentyOneTicks() public {
        snap_swapCall(false, true, 121);
    }

    // snapshot zeroForOne, exactOutput, 121 ticks crossed
    function test_gas_swapCall_zeroForOne_exactOutput_crossOneHundredTwentyOneTicks() public {
        snap_swapCall(true, false, 121);
    }

    // snapshot oneForZero, exactOutput, 121 ticks crossed
    function test_gas_swapCall_oneForZero_exactOutput_crossOneHundredTwentyOneTicks() public {
        snap_swapCall(false, false, 121);
    }

    // --------------------------

    // snapshot router gas zeroForOne, exactInput, 0 ticks crossed
    function test_gas_routerCall_zeroForOne_exactInput_withinTick() public {
        snap_routerCall(true, true, 0);
    }

    // snapshot router gas oneForZero, exactInput, 0 ticks crossed
    function test_gas_routerCall_oneForZero_exactInput_withinTick() public {
        snap_routerCall(false, true, 0);
    }

    // snapshot router gas zeroForOne, exactOutput, 0 ticks crossed
    function test_gas_routerCall_zeroForOne_exactOutput_withinTick() public {
        snap_routerCall(true, false, 0);
    }

    // snapshot router gas oneForZero, exactOutput, 0 ticks crossed
    function test_gas_routerCall_oneForZero_exactOutput_withinTick() public {
        snap_routerCall(false, false, 0);
    }

    // --------------------------

    // snapshot router gas zeroForOne, exactInput, 1 tick crossed
    function test_gas_routerCall_zeroForOne_exactInput_crossOneTick() public {
        snap_routerCall(true, true, 1);
    }

    // snapshot router gas oneForZero, exactInput, 1 tick crossed
    function test_gas_routerCall_oneForZero_exactInput_crossOneTick() public {
        snap_routerCall(false, true, 1);
    }

    // snapshot router gas zeroForOne, exactOutput, 1 tick crossed
    function test_gas_routerCall_zeroForOne_exactOutput_crossOneTick() public {
        snap_routerCall(true, false, 1);
    }

    // snapshot router gas oneForZero, exactOutput, 1 tick crossed
    function test_gas_routerCall_oneForZero_exactOutput_crossOneTick() public {
        snap_routerCall(false, false, 1);
    }

    // --------------------------

    // snapshot router gas zeroForOne, exactInput, 2 ticks crossed
    function test_gas_routerCall_zeroForOne_exactInput_crossTwoTicks() public {
        snap_routerCall(true, true, 2);
    }

    // snapshot router gas oneForZero, exactInput, 2 ticks crossed
    function test_gas_routerCall_oneForZero_exactInput_crossTwoTicks() public {
        snap_routerCall(false, true, 2);
    }

    // snapshot router gas zeroForOne, exactOutput, 2 ticks crossed
    function test_gas_routerCall_zeroForOne_exactOutput_crossTwoTicks() public {
        snap_routerCall(true, false, 2);
    }

    // snapshot router gas oneForZero, exactOutput, 2 ticks crossed
    function test_gas_routerCall_oneForZero_exactOutput_crossTwoTicks() public {
        snap_routerCall(false, false, 2);
    }

    // --------------------------

    // snapshot router gas zeroForOne, exactInput, 5 ticks crossed
    function test_gas_routerCall_zeroForOne_crossFiveTicks() public {
        snap_routerCall(true, true, 5);
    }

    // snapshot router gas oneForZero, exactInput, 5 ticks crossed
    function test_gas_routerCall_oneForZero_crossFiveTicks() public {
        snap_routerCall(false, true, 5);
    }

    // snapshot router gas zeroForOne, exactOutput, 5 ticks crossed
    function test_gas_routerCall_zeroForOne_exactOutput_crossFiveTicks() public {
        snap_routerCall(true, false, 5);
    }

    // snapshot router gas oneForZero, exactOutput, 5 ticks crossed
    function test_gas_routerCall_oneForZero_exactOutput_crossFiveTicks() public {
        snap_routerCall(false, false, 5);
    }

    // --------------------------

    // snapshot router gas zeroForOne, exactInput, 61 ticks crossed
    function test_gas_routerCall_zeroForOne_crossSixtyOneTicks() public {
        snap_routerCall(true, true, 61);
    }

    // snapshot router gas oneForZero, exactInput, 61 ticks crossed
    function test_gas_routerCall_oneForZero_crossSixtyOneTicks() public {
        snap_routerCall(false, true, 61);
    }

    // snapshot router gas zeroForOne, exactOutput, 61 ticks crossed
    function test_gas_routerCall_zeroForOne_exactOutput_crossSixtyOneTicks() public {
        snap_routerCall(true, false, 61);
    }

    // snapshot router gas oneForZero, exactOutput, 61 ticks crossed
    function test_gas_routerCall_oneForZero_exactOutput_crossSixtyOneTicks() public {
        snap_routerCall(false, false, 61);
    }

    // --------------------------

    // snapshot router gas zeroForOne, exactInput, 121 ticks crossed
    function test_gas_routerCall_zeroForOne_crossOneHundredTwentyOneTicks() public {
        snap_routerCall(true, true, 121);
    }

    // snapshot router gas oneForZero, exactInput, 121 ticks crossed
    function test_gas_routerCall_oneForZero_crossOneHundredTwentyOneTicks() public {
        snap_routerCall(false, true, 121);
    }

    // snapshot router gas zeroForOne, exactOutput, 121 ticks crossed
    function test_gas_routerCall_zeroForOne_exactOutput_crossOneHundredTwentyOneTicks() public {
        snap_routerCall(true, false, 121);
    }

    // snapshot router gas oneForZero, exactOutput, 121 ticks crossed
    function test_gas_routerCall_oneForZero_exactOutput_crossOneHundredTwentyOneTicks() public {
        snap_routerCall(false, false, 121);
    }

    // --------------------------

    function snap_swapCall(bool zeroForOne, bool exactInput, int256 ticksToCross) public {
        uint160 sqrtPriceLimit = zeroForOne
            ? TickMath.getSqrtPriceAtTick(int24(int256(currentTick) - (ticksToCross + 1))) + 1
            : TickMath.getSqrtPriceAtTick(int24(int256(currentTick) + (ticksToCross + 1))) - 1;
        minRouterWithSnapshot.setSnapshotString(
            string.concat(
                "swapCall ticksCrossed=",
                vm.toString(ticksToCross),
                " zeroForOne=",
                vm.toString(zeroForOne),
                " exactInput=",
                vm.toString(exactInput)
            )
        );
        minRouterWithSnapshot.swap(key, zeroForOne, exactInput, 100000e18, sqrtPriceLimit, ZERO_BYTES);

        (uint160 sqrtPriceX96,,,) = manager.getSlot0(key.toId());
        assertEq(sqrtPriceX96, sqrtPriceLimit);
        int24 tickAfterSwap = TickMath.getTickAtSqrtPrice(sqrtPriceX96);
        assertEq(tickAfterSwap, int24(int256(currentTick) + (zeroForOne ? -(ticksToCross + 1) : (ticksToCross))));
    }

    function snap_routerCall(bool zeroForOne, bool exactInput, int256 ticksToCross) public {
        uint160 sqrtPriceLimit = zeroForOne
            ? TickMath.getSqrtPriceAtTick(int24(int256(currentTick) - (ticksToCross + 1))) + 1
            : TickMath.getSqrtPriceAtTick(int24(int256(currentTick) + (ticksToCross + 1))) - 1;
        minRouter.swap(key, zeroForOne, exactInput, 100000e18, sqrtPriceLimit, ZERO_BYTES);
        vm.snapshotGasLastCall(
            string.concat(
                "routerCall ticksCrossed=",
                vm.toString(ticksToCross),
                " zeroForOne=",
                vm.toString(zeroForOne),
                " exactInput=",
                vm.toString(exactInput)
            )
        );

        (uint160 sqrtPriceX96,,,) = manager.getSlot0(key.toId());
        assertEq(sqrtPriceX96, sqrtPriceLimit);
        int24 tickAfterSwap = TickMath.getTickAtSqrtPrice(sqrtPriceX96);
        assertEq(tickAfterSwap, int24(int256(currentTick) + (zeroForOne ? -(ticksToCross + 1) : (ticksToCross))));
    }

    function test_swap(bool zeroForOne, bool exactInput) public {
        // Perform a test swap //
        BalanceDelta result = minRouter.swap(
            key, zeroForOne, exactInput, 1e18, zeroForOne ? MIN_PRICE_LIMIT : MAX_PRICE_LIMIT, ZERO_BYTES
        );

        if (zeroForOne) {
            assertLt(result.amount0(), 0);
            assertGt(result.amount1(), 0);
        } else {
            assertGt(result.amount0(), 0);
            assertLt(result.amount1(), 0);
        }
    }
}
