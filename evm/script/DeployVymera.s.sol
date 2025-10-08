// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Script, console} from "forge-std/Script.sol";
import {Vymera} from "../src/Vymera.sol";
import {CREATE3} from "solady/utils/CREATE3.sol";

/// @title DeployVymera
/// @notice Deployment script for the Vymera contract
contract DeployVymera is Script {
    bytes32 public constant SALT =
        keccak256(abi.encodePacked(bytes("Vymera is new crypto spending era")));
    address public constant OWNER = 0x9cb048e45aAA295Ebb4a9b3dEcb05c529C4C6D88;

    function run() external {
        // Get deployer private key from environment

        // Start broadcasting transactions
        bytes memory initCode = abi.encodePacked(
            type(Vymera).creationCode,
            abi.encode(OWNER)
        );
        vm.startBroadcast();
        address deployed = CREATE3.deployDeterministic(initCode, SALT);
        vm.stopBroadcast();

        // Log deployment info
        console.log("Contract Address:", deployed);
        console.log("Deployer Address:", Vymera(deployed).owner());
    }
}
