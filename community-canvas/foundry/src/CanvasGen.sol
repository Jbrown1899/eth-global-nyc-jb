// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/*
 * Canvas NFT with 1-byte pixels, timed completion, and mint/claim flows.
 * Requires OpenZeppelin:
 *   forge install OpenZeppelin/openzeppelin-contracts
 */

import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";
import {ERC721} from "openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";
import {ERC721Burnable} from "openzeppelin-contracts/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import {ReentrancyGuard} from "openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import {Strings} from "openzeppelin-contracts/contracts/utils/Strings.sol";

contract CanvasGen is ERC721, ERC721Burnable, Ownable, ReentrancyGuard {
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

    /*//////////////////////////////////////////////////////////////
                                 TYPES
    //////////////////////////////////////////////////////////////*/
    struct CanvasConfig {
        uint32  x;
        uint32  y;
        uint256 startBlock;
        uint256 maxDurationBlocks; // edit window in blocks
        bool    isComplete;
        bool    isClaimed;
        uint256 mostRecentUpdatedBlock;// continually updated until isComplete is set
        address owner;             // editor/creator before claim

    }

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/
    event PixelColored(address indexed editor, uint256 indexed canvasId, uint32 indexed x, uint32 y, uint8 color);
    event CanvasGenerated(uint256 indexed canvasId, address indexed owner, CanvasConfig config);
    event CanvasClaimed(uint256 indexed canvasId, address indexed owner);

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    // Canvas metadata
    mapping(uint256 => CanvasConfig) private s_canvases;

    // Pixel storage: 1-byte colors. We keep a “set” bitmap so the default can be 255 without pre-filling.
    mapping(uint256 => mapping(uint32 => mapping(uint32 => uint8))) private s_color;      // canvasId -> x -> y -> color
    mapping(uint256 => mapping(uint32 => mapping(uint32 => bool))) private s_colorSet;    // whether this pixel was explicitly set

    // ERC721 bookkeeping
    uint256 private s_lastCanvasId = 1;

    // Constants
    uint8 public constant DEFAULT_COLOR = 255; // white

    /*//////////////////////////////////////////////////////////////
                               MODIFIERS
    //////////////////////////////////////////////////////////////*/

    /// Updates completion flag based on time window.
    modifier updateCompletion(uint256 canvasId) {
        CanvasConfig storage canvas = s_canvases[canvasId];
        if (canvas.owner == address(0)) revert UnknownCanvas(canvasId);

        if (!canvas.isComplete && block.number >= canvas.startBlock + canvas.maxDurationBlocks) {
            canvas.isComplete = true;
        }
        _;
    }

    modifier onlyCanvasOwner(uint256 canvasId) {
        CanvasConfig storage canvas = s_canvases[canvasId];
        if (canvas.owner == address(0)) revert UnknownCanvas(canvasId);
        if (canvas.owner != msg.sender) revert NotCanvasOwner(canvasId, canvas.owner);
        _;
    }

    /*//////////////////////////////////////////////////////////////
                             MAIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    constructor() ERC721("CanvasGen", "CVG") {}

    /// @notice Create a new canvas with 1-byte pixels and a timed edit window.
    function generateCanvas(uint32 x, uint32 y, uint256 maxDurationBlocks)
        external
        returns (uint256 canvasId)
    {
        canvasId = s_lastCanvasId++;
        // Basic guards
        if (x == 0 || y == 0) revert CoordinatesCantBeZero(x, y);
        if (maxDurationBlocks == 0) revert DurationCantBeZero(maxDurationBlocks);
        //if (s_canvases[canvasId].owner != address(0)) revert CanvasAlreadyExistsTryAgain(); //might be redudant?

        s_canvases[canvasId] = CanvasConfig({
            x: x,
            y: y,
            startBlock: block.number,
            maxDurationBlocks: maxDurationBlocks,
            isComplete: false,
            isClaimed: false,
            mostRecentUpdatedBlock: block.number, // is set once canvas maxduration is completed
            owner: msg.sender
        });

        emit CanvasGenerated(canvasId, msg.sender, s_canvases[canvasId]);
    }

    /// @notice Color a pixel during the edit window. Anyone can edit it.
    function setPixel(uint256 canvasId, uint32 x, uint32 y, uint8 color)
        external
        updateCompletion(canvasId)
    {
        CanvasConfig storage canvas = s_canvases[canvasId];
        if (canvas.isComplete) revert CanvasFinished(canvasId);
        if (x >= canvas.x || y >= canvas.y) revert CoordinatesOOB(x, y);

        s_color[canvasId][x][y] = color;
        s_colorSet[canvasId][x][y] = true;

        canvas.mostRecentUpdatedBlock = block.number; // this continually updates until isComplete is set

        emit PixelColored(msg.sender, canvasId, x, y, color);
    }

    /// @notice Claim the canvas after it’s complete; mints an ERC721 representing it.
    function claim(uint256 canvasId)
        external
        nonReentrant
        updateCompletion(canvasId)
        onlyCanvasOwner(canvasId)
    {
        CanvasConfig storage canvas = s_canvases[canvasId];
        if (!canvas.isComplete) revert CanvasNotFinished(canvasId);
        if (canvas.isClaimed) revert CanvasAlreadyClaimed(canvasId);

        canvas.isClaimed = true;

        _mintNFT(canvasId, canvas.owner);

        emit CanvasClaimed(canvasId, canvas.owner);
    }

    /*//////////////////////////////////////////////////////////////
                               INTERNALS
    //////////////////////////////////////////////////////////////*/

    function _mintNFT(uint256 canvasId, address to) internal {
        _safeMint(to, canvasId);
    }

    /*//////////////////////////////////////////////////////////////
                               ERC721 META
    //////////////////////////////////////////////////////////////*/

    function tokenURI(uint256 canvasId) public view override returns (string memory) {
        require(_ownerOf(canvasId) != address(0), "ERC721: invalid token");
        
        CanvasConfig storage c = s_canvases[canvasId];

        // Minimal on-chain JSON. Swap "image" to an SVG or IPFS URL later.
        // Example image placeholder keeps gas low while you iterate.
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
                        '{"trait_type":"Complete","value":"', (c.isComplete ? "true" : "false"), '"}'
                    '],',
                    '"image":"data:,Canvas%20image%20to%20be%20added%20(off-chain%20or%20SVG)"',
                '}'
            )
        );

        // Base64 optional; plain JSON string is acceptable for many platforms that expect data:application/json
        return string(abi.encodePacked("data:application/json;utf8,", json));
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW / GETTERS
    //////////////////////////////////////////////////////////////*/

    function getCanvas(uint256 canvasId) external view returns (CanvasConfig memory) {
        CanvasConfig memory c = s_canvases[canvasId];
        if (c.owner == address(0)) revert UnknownCanvas(canvasId);
        return c;
    }

    /// @notice Returns the pixel color; if never set, returns DEFAULT_COLOR (255 = white).
    function getPixel(uint256 canvasId, uint32 x, uint32 y) external view returns (uint8 color) {
        CanvasConfig storage canvas = s_canvases[canvasId];
        if (canvas.owner == address(0)) revert UnknownCanvas(canvasId);
        if (x >= canvas.x || y >= canvas.y) revert CoordinatesOOB(x, y);

        if (s_colorSet[canvasId][x][y]) {
            color = s_color[canvasId][x][y];
        } else {
            color = DEFAULT_COLOR;
        }
    }
}
