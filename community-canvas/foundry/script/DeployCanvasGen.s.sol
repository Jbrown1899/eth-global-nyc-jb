// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Script} from "forge-std/Script.sol";
import {CanvasGen} from "../src/CanvasGen.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {console} from "forge-std/console.sol";

contract DeployCanvasGen is Script {
    function run() external returns (address) {
        return address(deployCanvasGen());
    }

    function deployCanvasGen() public returns (CanvasGen) {
        vm.startBroadcast();
        CanvasGen canvasGen = new CanvasGen();
        vm.stopBroadcast();
        return canvasGen;
    }
}