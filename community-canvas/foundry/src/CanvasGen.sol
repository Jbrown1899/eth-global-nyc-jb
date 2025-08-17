// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*
 * Canvas NFT with 1-byte pixels, timed completion, and mint/claim flows.
 * Requires OpenZeppelin:
 *   forge install OpenZeppelin/openzeppelin-contracts
 */

import {Base64} from "openzeppelin-contracts/contracts/utils/Base64.sol";
import {ERC721} from "openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";
import {ERC721Burnable} from "openzeppelin-contracts/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import {ReentrancyGuard} from "openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import {Strings} from "openzeppelin-contracts/contracts/utils/Strings.sol";

contract CanvasGen is ERC721, ERC721Burnable, ReentrancyGuard {
    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/
    error CanvasFinished(uint256 canvasId);
    error CanvasNotFinished(uint256 canvasId);
    error NotCanvasOwner(uint256 canvasId, address expected);
    error CanvasAlreadyClaimed(uint256 canvasId);
    error CoordinatesOOB(uint32 x, uint32 y);
    error UnknownCanvas(uint256 canvasId);
    error CoordinatesCantBeZero(uint32 x, uint32 y);
    error DurationCantBeZero(uint256 maxDurationBlocks);
    error CanvasAlreadyExistsTryAgain();
    error ERC721InvalidToken();

    /*//////////////////////////////////////////////////////////////
                                 TYPES
    //////////////////////////////////////////////////////////////*/
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

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/
    event PixelColored(address indexed editor, uint256 indexed canvasId, uint32 indexed x, uint32 y, uint8 color);
    event CanvasGenerated(
        uint256 indexed canvasId, 
        address indexed owner, 
        uint32 x, 
        uint32 y, 
        uint256 startBlock, 
        uint256 maxDurationBlocks
    );
    event CanvasClaimed(uint256 indexed canvasId, address indexed owner);

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/
    mapping(uint256 => CanvasConfig) private canvases;
    mapping(uint256 => mapping(uint32 => mapping(uint32 => uint8))) private color;      // canvasId -> x -> y -> color
    mapping(uint256 => mapping(uint32 => mapping(uint32 => bool))) private colorSet;    // whether pixel explicitly set
    uint256 private lastCanvasId = 1;

    uint8 public constant DEFAULT_COLOR = 255; // white

    /*//////////////////////////////////////////////////////////////
                               MODIFIERS
    //////////////////////////////////////////////////////////////*/
    modifier updateCompletion(uint256 canvasId) {
        CanvasConfig storage canvas = canvases[canvasId];
        if (canvas.owner == address(0)) revert UnknownCanvas(canvasId);

        if (!canvas.isComplete && block.number >= canvas.startBlock + canvas.maxDurationBlocks) {
            canvas.isComplete = true;
        }
        _;
    }

    modifier onlyCanvasOwner(uint256 canvasId) {
        CanvasConfig storage canvas = canvases[canvasId];
        if (canvas.owner == address(0)) revert UnknownCanvas(canvasId);
        if (canvas.owner != msg.sender) revert NotCanvasOwner(canvasId, canvas.owner);
        _;
    }

    /*//////////////////////////////////////////////////////////////
                             MAIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    constructor() ERC721("CanvasGen", "CVG") {}

    function generateCanvas(uint32 x, uint32 y, uint256 maxDurationBlocks)
        external
        returns (uint256 canvasId)
    {
        if (x == 0 || y == 0) revert CoordinatesCantBeZero(x, y);
        if (maxDurationBlocks == 0) revert DurationCantBeZero(maxDurationBlocks);

        canvasId = lastCanvasId++;
        canvases[canvasId] = CanvasConfig({
            x: x,
            y: y,
            startBlock: block.number,
            maxDurationBlocks: maxDurationBlocks,
            isComplete: false,
            isClaimed: false,
            mostRecentUpdatedBlock: block.number,
            owner: msg.sender,
            imageCid: ""
        });

        emit CanvasGenerated(canvasId, msg.sender, x, y, block.number, maxDurationBlocks);
    }

    function setPixel(uint256 canvasId, uint32 x, uint32 y, uint8 newColor)
        external
        updateCompletion(canvasId)
    {
        CanvasConfig storage canvas = canvases[canvasId];
        if (canvas.isComplete) revert CanvasFinished(canvasId);
        if (x >= canvas.x || y >= canvas.y) revert CoordinatesOOB(x, y);

        color[canvasId][x][y] = newColor;
        colorSet[canvasId][x][y] = true;

        canvas.mostRecentUpdatedBlock = block.number;
        emit PixelColored(msg.sender, canvasId, x, y, newColor);
    }

    function claim(uint256 canvasId, string calldata imageCid)
        external
        nonReentrant
        updateCompletion(canvasId)
        onlyCanvasOwner(canvasId)
    {
        CanvasConfig storage canvas = canvases[canvasId];
        if (!canvas.isComplete) revert CanvasNotFinished(canvasId);
        if (canvas.isClaimed) revert CanvasAlreadyClaimed(canvasId);

        canvas.isClaimed = true;
        canvas.imageCid = imageCid;

        _mintNft(canvasId, canvas.owner);
        emit CanvasClaimed(canvasId, canvas.owner);
    }

    /*//////////////////////////////////////////////////////////////
                               INTERNALS
    //////////////////////////////////////////////////////////////*/
    function _mintNft(uint256 canvasId, address to) internal {
        _safeMint(to, canvasId);
    }

    /*//////////////////////////////////////////////////////////////
                               ERC721 META
    //////////////////////////////////////////////////////////////*/
    function tokenURI(uint256 canvasId) public view override returns (string memory) {
        if (_ownerOf(canvasId) == address(0)) revert ERC721InvalidToken();

        CanvasConfig storage c = canvases[canvasId];
        string memory json = string(
            abi.encodePacked(
                '{',
                    '"name":"Canvas #', Strings.toString(canvasId), '",',
                    '"description":"Timed canvas with 1-byte pixels. Width=', Strings.toString(c.x),
                        ', Height=', Strings.toString(c.y), '.",',
                    '"attributes":['
                        '{"trait_type":"Width","value":', Strings.toString(c.x), '},',
                        '{"trait_type":"Height","value":', Strings.toString(c.y), '},',
                        '{"trait_type":"Start Block","value":', Strings.toString(c.startBlock), '},',
                        '{"trait_type":"Final Block","value":', Strings.toString(c.mostRecentUpdatedBlock), '},',
                        '{"trait_type":"Complete","value":"', (c.isComplete ? "true" : "false"), '"}',
                    '"image":"ipfs://', c.imageCid, '"',
                '}'
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(bytes(json))));
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW / GETTERS
    //////////////////////////////////////////////////////////////*/
    function getCanvas(uint256 canvasId) external view returns (CanvasConfig memory) {
        CanvasConfig memory c = canvases[canvasId];
        if (c.owner == address(0)) revert UnknownCanvas(canvasId);
        return c;
    }

    function getPixel(uint256 canvasId, uint32 x, uint32 y) external view returns (uint8) {
        CanvasConfig storage canvas = canvases[canvasId];
        if (canvas.owner == address(0)) revert UnknownCanvas(canvasId);
        if (x >= canvas.x || y >= canvas.y) revert CoordinatesOOB(x, y);

        return colorSet[canvasId][x][y] ? color[canvasId][x][y] : DEFAULT_COLOR;
    }
}
