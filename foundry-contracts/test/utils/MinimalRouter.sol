// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {CurrencyLibrary, Currency} from "v4-core/src/types/Currency.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {BalanceDelta} from "v4-core/src/types/BalanceDelta.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {IHooks} from "v4-core/src/interfaces/IHooks.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {CurrencySettler} from "v4-core/test/utils/CurrencySettler.sol";
import {SafeCallback} from "v4-periphery/src/base/SafeCallback.sol";
import {TickMath} from "v4-core/src/libraries/TickMath.sol";

import {CommonBase} from "forge-std/Base.sol";

contract MinimalRouter is SafeCallback {
    using CurrencySettler for Currency;

    uint160 public constant MIN_PRICE_LIMIT = TickMath.MIN_SQRT_PRICE + 1;
    uint160 public constant MAX_PRICE_LIMIT = TickMath.MAX_SQRT_PRICE - 1;

    constructor(IPoolManager _manager) SafeCallback(_manager) {}

    function swap(
        PoolKey memory key,
        bool zeroForOne,
        bool exactInput,
        uint256 amount,
        uint160 sqrtPriceLimit,
        bytes memory hookData
    ) external payable returns (BalanceDelta delta) {
        delta = abi.decode(
            poolManager.unlock(abi.encode(msg.sender, key, zeroForOne, exactInput, amount, sqrtPriceLimit, hookData)),
            (BalanceDelta)
        );

        uint256 ethBalance = address(this).balance;
        if (ethBalance > 0) CurrencyLibrary.ADDRESS_ZERO.transfer(msg.sender, ethBalance);
    }

    function _unlockCallback(bytes calldata data) internal override returns (bytes memory) {
        (
            address sender,
            PoolKey memory key,
            bool zeroForOne,
            bool exactInput,
            uint256 amount,
            uint160 sqrtPriceLimit,
            bytes memory hookData
        ) = abi.decode(data, (address, PoolKey, bool, bool, uint256, uint160, bytes));

        IPoolManager.SwapParams memory params = IPoolManager.SwapParams({
            zeroForOne: zeroForOne,
            amountSpecified: exactInput ? -int256(amount) : int256(amount),
            sqrtPriceLimitX96: sqrtPriceLimit
        });
        BalanceDelta delta = poolManager.swap(key, params, hookData);

        if (delta.amount0() < 0) key.currency0.settle(poolManager, sender, uint256(int256(-delta.amount0())), false);
        else if (delta.amount0() > 0) key.currency0.take(poolManager, sender, uint256(int256(delta.amount0())), false);

        if (delta.amount1() < 0) key.currency1.settle(poolManager, sender, uint256(int256(-delta.amount1())), false);
        else if (delta.amount1() > 0) key.currency1.take(poolManager, sender, uint256(int256(delta.amount1())), false);

        return abi.encode(delta);
    }
}

contract MinimalRouterWithSnapshot is SafeCallback, CommonBase {
    using CurrencySettler for Currency;

    string public snapshotString;

    uint160 public constant MIN_PRICE_LIMIT = TickMath.MIN_SQRT_PRICE + 1;
    uint160 public constant MAX_PRICE_LIMIT = TickMath.MAX_SQRT_PRICE - 1;

    constructor(IPoolManager _manager) SafeCallback(_manager) {}

    function swap(
        PoolKey memory key,
        bool zeroForOne,
        bool exactInput,
        uint256 amount,
        uint160 sqrtPriceLimit,
        bytes memory hookData
    ) external payable returns (BalanceDelta delta) {
        delta = abi.decode(
            poolManager.unlock(abi.encode(msg.sender, key, zeroForOne, exactInput, amount, sqrtPriceLimit, hookData)),
            (BalanceDelta)
        );

        uint256 ethBalance = address(this).balance;
        if (ethBalance > 0) CurrencyLibrary.ADDRESS_ZERO.transfer(msg.sender, ethBalance);
    }

    function _unlockCallback(bytes calldata data) internal override returns (bytes memory) {
        (
            address sender,
            PoolKey memory key,
            bool zeroForOne,
            bool exactInput,
            uint256 amount,
            uint160 sqrtPriceLimit,
            bytes memory hookData
        ) = abi.decode(data, (address, PoolKey, bool, bool, uint256, uint160, bytes));

        IPoolManager.SwapParams memory params = IPoolManager.SwapParams({
            zeroForOne: zeroForOne,
            amountSpecified: exactInput ? -int256(amount) : int256(amount),
            sqrtPriceLimitX96: sqrtPriceLimit
        });
        BalanceDelta delta = poolManager.swap(key, params, hookData);
        vm.snapshotGasLastCall(snapshotString);

        if (delta.amount0() < 0) key.currency0.settle(poolManager, sender, uint256(int256(-delta.amount0())), false);
        else if (delta.amount0() > 0) key.currency0.take(poolManager, sender, uint256(int256(delta.amount0())), false);

        if (delta.amount1() < 0) key.currency1.settle(poolManager, sender, uint256(int256(-delta.amount1())), false);
        else if (delta.amount1() > 0) key.currency1.take(poolManager, sender, uint256(int256(delta.amount1())), false);

        return abi.encode(delta);
    }

    function setSnapshotString(string memory _snapshotString) external {
        snapshotString = _snapshotString;
    }
}
