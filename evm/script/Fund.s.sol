// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Script, console} from "forge-std/Script.sol";
import {Bymera} from "../src/Bymera.sol";

/// @title DeployBymera
/// @notice Deployment script for the Bymera contract
contract Fund is Script {
    address public constant VYMERA_ADDRESS =
        0xc6BB3C35f6a80338C49C3e4F2c083f21ac36d693;
    uint256 public constant FUNDING_ID = 80900106878935471851392537339196343694;

    function run() external {
        vm.startBroadcast();
        Bymera(VYMERA_ADDRESS).fund(FUNDING_ID, address(0), 0, "EUR", 2320);
        vm.stopBroadcast();

        // Log deployment info
        console.log("Funding ID:", FUNDING_ID);
    }
}
