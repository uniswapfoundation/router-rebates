// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
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

import {SignatureRebates} from "../src/SignatureRebates.sol";
import {PoolSwapTestClaimable} from "../src/test/PoolSwapTestClaimable.sol";

/// @notice Forge script for deploying v4 & hooks to **anvil**
/// @dev This script only works on an anvil RPC because v4 exceeds bytecode limits
contract AnvilScript is Script {
    address constant CREATE2_DEPLOYER = address(0x4e59b44847b379578588920cA78FbF26c0B4956C);
    bytes constant ZERO_BYTES = new bytes(0);

    SignatureRebates rebates;

    MockERC20 token0;
    MockERC20 token1;
    MockERC20 rewardToken;

    PoolKey poolKey;
    IPoolManager manager;
    PoolSwapTestClaimable swapRouter;
    PoolModifyLiquidityTest lpRouter;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();
        (token0, token1, rewardToken) = deployTokens();
        vm.stopBroadcast();

        vm.startBroadcast();
        rebates = new SignatureRebates("FOUNDATION", address(0));
        rewardToken.mint(msg.sender, 1_000_000e18);
        rewardToken.approve(address(rebates), type(uint256).max);
        vm.stopBroadcast();

        vm.startBroadcast();
        deployUniswapV4();
        vm.stopBroadcast();

        vm.startBroadcast();
        createPoolWithLiquidity();
        vm.stopBroadcast();
    }

    // -----------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------
    function deployTokens() internal returns (MockERC20 _token0, MockERC20 _token1, MockERC20 _rewardToken) {
        MockERC20 tokenA = new MockERC20("MockA", "A", 18);
        MockERC20 tokenB = new MockERC20("MockB", "B", 18);
        _rewardToken = new MockERC20("Reward", "R", 18);

        if (uint160(address(tokenA)) < uint160(address(tokenB))) {
            _token0 = tokenA;
            _token1 = tokenB;
        } else {
            _token0 = tokenB;
            _token1 = tokenA;
        }
    }

    function deployUniswapV4() internal {
        manager = new PoolManager();
        lpRouter = new PoolModifyLiquidityTest(manager);
        swapRouter = new PoolSwapTestClaimable(manager, rebates);
    }

    function createPoolWithLiquidity() internal {
        token0.mint(msg.sender, 100_000 ether);
        token1.mint(msg.sender, 100_000 ether);

        token0.approve(address(lpRouter), type(uint256).max);
        token1.approve(address(lpRouter), type(uint256).max);

        // initialize the pool
        int24 tickSpacing = 60;
        poolKey = PoolKey(
            Currency.wrap(address(token0)), Currency.wrap(address(token1)), 3000, tickSpacing, IHooks(address(0))
        );
        manager.initialize(poolKey, Constants.SQRT_PRICE_1_1, ZERO_BYTES);

        // add full range liquidity to the pool
        lpRouter.modifyLiquidity(
            poolKey,
            IPoolManager.ModifyLiquidityParams(
                TickMath.minUsableTick(tickSpacing), TickMath.maxUsableTick(tickSpacing), 100 ether, 0
            ),
            ZERO_BYTES
        );
    }

    function swap() internal {
        // approve the tokens to the routers
        token0.approve(address(swapRouter), type(uint256).max);
        token1.approve(address(swapRouter), type(uint256).max);

        // swap some tokens
        bool zeroForOne = true;
        int256 amountSpecified = 1 ether;
        IPoolManager.SwapParams memory params = IPoolManager.SwapParams({
            zeroForOne: zeroForOne,
            amountSpecified: amountSpecified,
            sqrtPriceLimitX96: zeroForOne ? TickMath.MIN_SQRT_PRICE + 1 : TickMath.MAX_SQRT_PRICE - 1 // unlimited impact
        });
        PoolSwapTest.TestSettings memory testSettings =
            PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false});
        swapRouter.swap(poolKey, params, testSettings, ZERO_BYTES);
    }
}
