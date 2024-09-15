// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {IHooks} from "v4-core/src/interfaces/IHooks.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {Currency} from "v4-core/src/types/Currency.sol";
import {BalanceDelta} from "v4-core/src/types/BalanceDelta.sol";
import {TickMath} from "v4-core/src/libraries/TickMath.sol";
import {SafeCast} from "v4-core/src/libraries/SafeCast.sol";

import {IV4Router} from "v4-periphery/src/interfaces/IV4Router.sol";
import {DeltaResolver} from "v4-periphery/src/base/DeltaResolver.sol";
import {SafeCallback} from "v4-periphery/src/base/SafeCallback.sol";

import {ActionConstants} from "v4-periphery/src/libraries/ActionConstants.sol";
import {PathKey, PathKeyLibrary} from "v4-periphery/src/libraries/PathKey.sol";

import {Rebates} from "./Rebates.sol";

abstract contract Router is DeltaResolver, SafeCallback, IV4Router {
    using PathKeyLibrary for PathKey;
    using SafeCast for *;

    uint8 internal constant SWAP_EXACT_INPUT_SINGLE = 0;
    uint8 internal constant SWAP_EXACT_INPUT = 1;
    uint8 internal constant SWAP_EXACT_OUTPUT_SINGLE = 2;
    uint8 internal constant SWAP_EXACT_OUTPUT = 3;

    function _unlockCallback(bytes calldata data) internal override returns (bytes memory) {
        uint8 operation = uint8(bytes1(data[:1]));
        // handle _swap calls
        if (operation == SWAP_EXACT_INPUT_SINGLE) {
            (, ExactInputSingleParams memory params) = abi.decode(data, (uint8, ExactInputSingleParams));
            _swapExactInputSingle(params);
            if (params.zeroForOne) {
                // pay token 0
                // take token1
            }
            else {
                // pay token 1
                // take token0
            }
        }

        // resolve deltas
    }

    function _swapExactInputSingle(ExactInputSingleParams memory params) private {
        uint128 amountIn = params.amountIn;
        if (amountIn == ActionConstants.OPEN_DELTA) {
            amountIn =
                _getFullCredit(params.zeroForOne ? params.poolKey.currency0 : params.poolKey.currency1).toUint128();
        }
        uint128 amountOut = _swap(
            params.poolKey, params.zeroForOne, -int256(uint256(amountIn)), params.sqrtPriceLimitX96, params.hookData
        ).toUint128();
        if (amountOut < params.amountOutMinimum) revert V4TooLittleReceived(params.amountOutMinimum, amountOut);
    }

    function _swapExactInput(ExactInputParams calldata params) private {
        unchecked {
            // Caching for gas savings
            uint256 pathLength = params.path.length;
            uint128 amountOut;
            Currency currencyIn = params.currencyIn;
            uint128 amountIn = params.amountIn;
            if (amountIn == ActionConstants.OPEN_DELTA) amountIn = _getFullCredit(currencyIn).toUint128();
            PathKey calldata pathKey;

            for (uint256 i = 0; i < pathLength; i++) {
                pathKey = params.path[i];
                (PoolKey memory poolKey, bool zeroForOne) = pathKey.getPoolAndSwapDirection(currencyIn);
                // The output delta will always be positive, except for when interacting with certain hook pools
                amountOut = _swap(poolKey, zeroForOne, -int256(uint256(amountIn)), 0, pathKey.hookData).toUint128();

                amountIn = amountOut;
                currencyIn = pathKey.intermediateCurrency;
            }

            if (amountOut < params.amountOutMinimum) revert V4TooLittleReceived(params.amountOutMinimum, amountOut);
        }
    }

    function _swapExactOutputSingle(ExactOutputSingleParams calldata params) private {
        uint128 amountOut = params.amountOut;
        if (amountOut == ActionConstants.OPEN_DELTA) {
            amountOut =
                _getFullDebt(params.zeroForOne ? params.poolKey.currency1 : params.poolKey.currency0).toUint128();
        }
        uint128 amountIn = (
            uint256(
                -int256(
                    _swap(
                        params.poolKey,
                        params.zeroForOne,
                        int256(uint256(amountOut)),
                        params.sqrtPriceLimitX96,
                        params.hookData
                    )
                )
            )
        ).toUint128();
        if (amountIn > params.amountInMaximum) revert V4TooMuchRequested(params.amountInMaximum, amountIn);
    }

    function _swapExactOutput(ExactOutputParams calldata params) private {
        unchecked {
            // Caching for gas savings
            uint256 pathLength = params.path.length;
            uint128 amountIn;
            uint128 amountOut = params.amountOut;
            Currency currencyOut = params.currencyOut;
            PathKey calldata pathKey;

            if (amountOut == ActionConstants.OPEN_DELTA) {
                amountOut = _getFullDebt(currencyOut).toUint128();
            }

            for (uint256 i = pathLength; i > 0; i--) {
                pathKey = params.path[i - 1];
                (PoolKey memory poolKey, bool oneForZero) = pathKey.getPoolAndSwapDirection(currencyOut);
                // The output delta will always be negative, except for when interacting with certain hook pools
                amountIn = (
                    uint256(-int256(_swap(poolKey, !oneForZero, int256(uint256(amountOut)), 0, pathKey.hookData)))
                ).toUint128();

                amountOut = amountIn;
                currencyOut = pathKey.intermediateCurrency;
            }
            if (amountIn > params.amountInMaximum) revert V4TooMuchRequested(params.amountInMaximum, amountIn);
        }
    }

    function _swap(
        PoolKey memory poolKey,
        bool zeroForOne,
        int256 amountSpecified,
        uint160 sqrtPriceLimitX96,
        bytes memory hookData
    ) private returns (int128 reciprocalAmount) {
        // if (poolKey.hooks != IHooks(address(0))) _boostForHook(referrer);
        unchecked {
            BalanceDelta delta = poolManager.swap(
                poolKey,
                IPoolManager.SwapParams(
                    zeroForOne,
                    amountSpecified,
                    sqrtPriceLimitX96 == 0
                        ? (zeroForOne ? TickMath.MIN_SQRT_PRICE + 1 : TickMath.MAX_SQRT_PRICE - 1)
                        : sqrtPriceLimitX96
                ),
                hookData
            );

            reciprocalAmount = (zeroForOne == amountSpecified < 0) ? delta.amount1() : delta.amount0();
        }
    }
}
