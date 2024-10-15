// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import {console2} from "forge-std/console2.sol";
import {CommonBase} from "forge-std/Base.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "v4-core/src/interfaces/IPoolManager.sol";
import {BalanceDelta} from "v4-core/src/types/BalanceDelta.sol";
import {Currency} from "v4-core/src/types/Currency.sol";
import {CurrencySettler} from "v4-core/test/utils/CurrencySettler.sol";

/// @title Simple Swap Router
/// @notice Used for logging gas cost of swap
contract PoolSwapTestClaimable is CommonBase {
    using CurrencySettler for Currency;

    IPoolManager public manager;

    constructor(IPoolManager _manager) {
        manager = _manager;
    }

    function swap(PoolKey memory poolKey, int256 amountSpecified, bool zeroForOne) external {
        manager.unlock(abi.encode(msg.sender, poolKey, amountSpecified, zeroForOne));
    }

    function unlockCallback(bytes memory data) external {
        (address sender, PoolKey memory poolKey, int256 amountSpecified, bool zeroForOne) =
            abi.decode(data, (address, PoolKey, int256, bool));
        bytes memory hookData = new bytes(0);
        BalanceDelta delta = manager.swap(
            poolKey,
            IPoolManager.SwapParams({amountSpecified: amountSpecified, zeroForOne: zeroForOne, sqrtPriceLimitX96: 0}),
            hookData
        );
        uint256 gas = vm.lastCallGas().gasTotalUsed;
        console2.log(gas);

        delta.amount0() < 0
            ? poolKey.currency0.settle(manager, sender, uint256(int256(-delta.amount0())), false)
            : poolKey.currency0.take(manager, sender, uint256(int256(delta.amount0())), false);

        delta.amount1() < 0
            ? poolKey.currency1.settle(manager, sender, uint256(int256(-delta.amount1())), false)
            : poolKey.currency1.take(manager, sender, uint256(int256(delta.amount1())), false);
    }
}
