// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {CanvasGen} from "../src/CanvasGen.sol";
import {Base64} from "openzeppelin-contracts/contracts/utils/Base64.sol";

contract CanvasGenTest is Test {
    CanvasGen canvasGen;

    address user1 = makeAddr("user1");
    address user2 = makeAddr("user2");
    address deployer = makeAddr("deployer");

    event PixelColored(address indexed editor, uint256 indexed canvasId, uint32 indexed x, uint32 y, uint8 color);
    event CanvasGenerated(uint256 indexed canvasId, address indexed owner, CanvasConfig config);
    event CanvasClaimed(uint256 indexed canvasId, address indexed owner);

    struct CanvasConfig {
        uint32 x; //this is x pixels but is indexed starting at 0
        uint32 y;
        uint256 startBlock;
        uint256 maxDurationBlocks;
        bool isComplete;
        bool isClaimed;
        uint256 mostRecentUpdatedBlock;
        address owner; // editor/creator before claim
        string imageCid; // IPFS component for tokenURI
    }

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

    function _equal(string memory a, string memory b) internal pure returns (bool) {
        return keccak256(bytes(a)) == keccak256(bytes(b));
    }

    //////////////////////////////////////////////
    //              TESTS                       //
    //////////////////////////////////////////////

    function testGenerateCanvas() public {
        uint256 id = _createCanvas(user1);
        CanvasGen.CanvasConfig memory c = canvasGen.getCanvas(id);

        assertEq(c.x, 10);
        assertEq(c.y, 10);
        assertEq(c.owner, user1);
        assertEq(c.isComplete, false);
        assertEq(c.isClaimed, false);
    }

    function testSetPixel() public {
        uint256 id = _createCanvas(user1);

        vm.prank(user2); // anyone can set pixel
        canvasGen.setPixel(id, 3, 3, 42);

        uint8 color = canvasGen.getPixel(id, 3, 3);
        assertEq(color, 42);

        // default color check
        uint8 defaultColor = canvasGen.getPixel(id, 0, 0);
        assertEq(defaultColor, 255); // DEFAULT_COLOR
    }

    function testSetPixelEmitsEvent() public {
        uint256 id = _createCanvas(user1);

        vm.startPrank(user1);

        // Tell Foundry to expect an event
        vm.expectEmit(true, true, true, true); // check indexed and non-indexed fields
        emit PixelColored(user1, id, 0, 0, 42);

        canvasGen.setPixel(id, 0, 0, 42);

        vm.stopPrank();
    }

    function testCannotSetPixelOutOfBounds() public {
        uint256 id = _createCanvas(user1);

        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(CanvasGen.CoordinatesOOB.selector, 20, 20));
        canvasGen.setPixel(id, 20, 20, 1);
    }

    function testClaimCanvas() public {
        uint256 id = _createCanvas(user1);

        // Move blocks forward to pass maxDurationBlocks
        vm.roll(block.number + 10);

        vm.prank(user1);
        canvasGen.claim(id, "QmFakeCID");

        CanvasGen.CanvasConfig memory c = canvasGen.getCanvas(id);
        assertEq(c.isClaimed, true);
        assertEq(c.imageCid, "QmFakeCID");
    }

    function testCannotClaimBeforeComplete() public {
        uint256 id = _createCanvas(user1);

        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSelector(CanvasGen.CanvasNotFinished.selector, id));
        canvasGen.claim(id, "QmFakeCID");
    }

    function testOnlyOwnerCanClaim() public {
        uint256 id = _createCanvas(user1);

        vm.roll(block.number + 10);

        vm.prank(user2);
        vm.expectRevert(abi.encodeWithSelector(CanvasGen.NotCanvasOwner.selector, id, user1));
        canvasGen.claim(id, "QmFakeCID");
    }

    function testTokenURIContainsIPFS() public {
        uint256 id = _createCanvas(user1);
        vm.roll(block.number + 10);

        vm.prank(user1);
        canvasGen.claim(id, "QmFakeCID");

        string memory uri = canvasGen.tokenURI(id);
        assertTrue(bytes(uri).length > 0);
        assertTrue(bytes(uri)[0] == "d"); // starts with data:application/json;base64
    }

    function testTwoCanvasesLifecycle() public {
        // === 1. Create two canvases ===
        uint256 id1 = _createCanvas(user1);
        uint256 id2 = _createCanvas(user2);

        // === 2. Update canvases ===
        vm.prank(user1);
        canvasGen.setPixel(id1, 0, 0, 1); // user1 colors (0,0) with color 1

        vm.prank(user2);
        canvasGen.setPixel(id1, 0, 0, 3); // user1 colors (0,0) with color 1

        vm.prank(user2);
        canvasGen.setPixel(id2, 1, 1, 2); // user2 colors (1,1) with color 2

        // === 3. Claim canvases ===
        vm.roll(block.number + 10); // advance blocks so claim condition passes

        vm.prank(user1);
        canvasGen.claim(id1, "QmCID1");

        vm.prank(user2);
        canvasGen.claim(id2, "QmCID2");

        vm.roll(block.number + 1);

        // === 4. Verify ownership after claim ===
        assertEq(canvasGen.ownerOf(id1), user1);
        assertEq(canvasGen.ownerOf(id2), user2);

        // === 5. Verify URIs ===
        string memory uri1 = canvasGen.tokenURI(id1);
        string memory uri2 = canvasGen.tokenURI(id2);

        assertTrue(bytes(uri1).length > 0);
        assertTrue(bytes(uri2).length > 0);
        assertTrue(!_equal(uri1, uri2)); // canvases produce different URIs
    }

    function testTokenURIRevertsIfTokenDoesNotExist() public {
        uint256 invalidCanvasId = 9999; // any ID that hasn't been generated

        // Expect the custom error
        vm.expectRevert(CanvasGen.ERC721InvalidToken.selector);

        // Call tokenURI with the invalid ID
        canvasGen.tokenURI(invalidCanvasId);
    }


    //////////////////////////////////////
    // Test getCanvas()
    //////////////////////////////////////
    function testGetCanvasReturnsCorrectConfig() public {
        // Generate a canvas
        uint256 id = _createCanvas(user1);

        // Fetch it
        CanvasGen.CanvasConfig memory c = canvasGen.getCanvas(id);

        assertEq(c.x, 10);
        assertEq(c.y, 10);
        assertEq(c.owner, address(user1)); // default sender in forge test
        assertFalse(c.isComplete);
        assertFalse(c.isClaimed);
    }

    function testGetCanvasRevertsIfUnknown() public {
        vm.expectRevert(abi.encodeWithSelector(CanvasGen.UnknownCanvas.selector, 999));
        canvasGen.getCanvas(999);
    }

    //////////////////////////////////////
    // Test getPixel()
    //////////////////////////////////////
    function testGetPixelReturnsDefaultColor() public {
        uint256 id = _createCanvas(user1);

        // Pixels not set should return DEFAULT_COLOR = 255
        uint8 px = canvasGen.getPixel(id, 2, 2);
        assertEq(px, 255);
    }

    function testGetPixelReturnsSetColor() public {
        uint256 id = _createCanvas(user1);

        // Set a pixel
        canvasGen.setPixel(id, 1, 1, 42);

        uint8 px = canvasGen.getPixel(id, 1, 1);
        assertEq(px, 42);
    }

    function testGetPixelRevertsIfOutOfBounds() public {
        uint256 id = _createCanvas(user1);

        vm.expectRevert(abi.encodeWithSelector(CanvasGen.CoordinatesOOB.selector, 10, 10));
        canvasGen.getPixel(id, 10, 10);
    }

    function testGetPixelRevertsIfUnknownCanvas() public {
        vm.expectRevert(abi.encodeWithSelector(CanvasGen.UnknownCanvas.selector, 1234));
        canvasGen.getPixel(1234, 0, 0);
    }

}
