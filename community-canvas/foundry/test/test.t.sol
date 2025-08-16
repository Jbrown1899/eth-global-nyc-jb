// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {CanvasGen} from "../src/CanvasGen.sol";

contract CanvasGenTest is Test {
    CanvasGen canvasGen;

    address user1 = makeAddr("user1");
    address user2 = makeAddr("user2");
    address deployer = makeAddr("deployer");

    uint256 canvasId;

    function setUp() public {
        vm.startPrank(deployer);
        canvasGen = new CanvasGen();
        vm.stopPrank();
    }

    //////////////////////////////////////////////
    //              HELPER FUNCTIONS            //
    //////////////////////////////////////////////

    function _createCanvas(address creator) internal returns (uint256) {
        vm.startPrank(creator);
        uint256 id = canvasGen.generateCanvas(10, 10, 5); // 10x10 canvas, 5 block duration
        vm.stopPrank();
        return id;
    }

    //////////////////////////////////////////////
    //              TESTS                        //
    //////////////////////////////////////////////

    // function testGenerateCanvas() public {
    //     uint256 id = _createCanvas(user1);
    //     CanvasGen.CanvasConfig memory c = canvasGen.getCanvas(id);

    //     assertEq(c.x, 10);
    //     assertEq(c.y, 10);
    //     assertEq(c.owner, user1);
    //     assertEq(c.isComplete, false);
    //     assertEq(c.isClaimed, false);
    // }

    // function testSetPixel() public {
    //     uint256 id = _createCanvas(user1);

    //     vm.prank(user2); // anyone can set pixel
    //     canvasGen.setPixel(id, 3, 3, 42);

    //     uint8 color = canvasGen.getPixel(id, 3, 3);
    //     assertEq(color, 42);

    //     // default color check
    //     uint8 defaultColor = canvasGen.getPixel(id, 0, 0);
    //     assertEq(defaultColor, 255); // DEFAULT_COLOR
    // }

    // function testCannotSetPixelOutOfBounds() public {
    //     uint256 id = _createCanvas(user1);

    //     vm.prank(user1);
    //     vm.expectRevert(abi.encodeWithSelector(CanvasGen.CoordinatesOOB.selector, 20, 20));
    //     canvasGen.setPixel(id, 20, 20, 1);
    // }

    // function testClaimCanvas() public {
    //     uint256 id = _createCanvas(user1);

    //     // Move blocks forward to pass maxDurationBlocks
    //     vm.roll(block.number + 10);

    //     vm.prank(user1);
    //     canvasGen.claim(id, "QmFakeCID");

    //     CanvasGen.CanvasConfig memory c = canvasGen.getCanvas(id);
    //     assertEq(c.isClaimed, true);
    //     assertEq(c.imageCid, "QmFakeCID");
    // }

    // function testCannotClaimBeforeComplete() public {
    //     uint256 id = _createCanvas(user1);

    //     vm.prank(user1);
    //     vm.expectRevert(abi.encodeWithSelector(CanvasGen.CanvasNotFinished.selector, id));
    //     canvasGen.claim(id, "QmFakeCID");
    // }

    function testOnlyOwnerCanClaim() public {
        uint256 id = _createCanvas(user1);

        vm.roll(block.number + 10);

        vm.prank(user2);
        vm.expectRevert(abi.encodeWithSelector(CanvasGen.NotCanvasOwner.selector, id, user1));
        canvasGen.claim(id, "QmFakeCID");
    }

    // function testTokenURIContainsIPFS() public {
    //     uint256 id = _createCanvas(user1);
    //     vm.roll(block.number + 10);

    //     vm.prank(user1);
    //     canvasGen.claim(id, "QmFakeCID");

    //     string memory uri = canvasGen.tokenURI(id);
    //     assertTrue(bytes(uri).length > 0);
    //     assertTrue(bytes(uri).length > 0 && bytes(uri)[0] == "d"); // starts with data:application/json;base64
    //     assertTrue(bytes(uri).length > 0 && bytes(uri).length > 0 && bytes(uri).length > 0);
    // }
}
