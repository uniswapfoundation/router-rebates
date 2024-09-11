// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {SafeCallback} from "v4-periphery/src/base/SafeCallback.sol";
import {Router, IV4Router} from "./base/Router.sol";

contract FoundationRouter is Router {
    constructor(IPoolManager _poolManager) SafeCallback(_poolManager) {}

    function swapExactInputSingle(IV4Router.ExactInputSingleParams calldata params) external {
        poolManager.unlock(abi.encode(SWAP_EXACT_INPUT_SINGLE, params));
    }

    function swapExactInput(IV4Router.ExactInputParams calldata params) external {}
    function swapExactOutputSingle(IV4Router.ExactOutputSingleParams calldata params) external {}
    function swapExactOutput(IV4Router.ExactOutputSingleParams calldata params) external {}
}
