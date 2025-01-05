// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import {IRebateClaimer} from "./IRebateClaimer.sol";
import {Owned} from "solmate/src/auth/Owned.sol";

abstract contract RebateClaimer is Owned, IRebateClaimer {
    constructor(address _owner) Owned(_owner) {}

    function rebateClaimer() external view override returns (address) {
        return owner;
    }
}
