import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useEvmAddress } from '@coinbase/cdp-hooks';
import {
  SendTransactionButton,
  type SendTransactionButtonProps,
} from "@coinbase/cdp-react/components/SendTransactionButton";
import { chainsToContracts, canvasGenAbi } from '../utils/constants';
import { encodeFunctionData } from "viem";
// No need to import CgSpinner from react-icons/cg as we are creating a custom spinner.

// The GraphQL endpoint URL. This should be replaced with your actual endpoint.
const GRAPHQL_ENDPOINT = 'http://localhost:3001/graphql';

// GraphQL query to get all available canvases
const GET_ALL_CANVASES_QUERY = `
  query GetAllCanvases {
    allCanvasGenerateds(orderBy: [CANVAS_ID_ASC]) {
      nodes {
        canvasId
        x
        y
      }
    }
  }
`;

// GraphQL query to get the canvas dimensions (X and Y)
const GET_CANVAS_DIMENSIONS_QUERY = `
  query GetCanvasDimensions($canvasId: String!) {
    allCanvasGenerateds(condition: { canvasId: $canvasId }) {
      nodes {
        x
        y
      }
    }
  }
`;

// GraphQL query to get all colored pixels for a given canvas
const GET_PIXEL_DATA_QUERY = `
  query GetPixelData($canvasId: String!) {
    allPixelColoreds(
      condition: { canvasId: $canvasId }
      orderBy: [BLOCK_NUMBER_ASC, RINDEXER_ID_ASC]
    ) {
      nodes {
        x
        y
        color
        blockNumber
      }
    }
  }
`;

/**
 * Custom hook to fetch data from the GraphQL endpoint.
 * This is a simple wrapper around the native fetch API.
 * In a real application, you might use a more robust client like Apollo or URQL.
 */
const useGraphQLQuery = (query: string, variables: Record<string, any> = {}) => {
  return useQuery({
    queryKey: [query, variables],
    queryFn: async () => {
      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, variables }),
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    },
    // The query will not run until the variables (especially canvasId) are provided
    enabled: variables.canvasId ? !!variables.canvasId : true,
    // Add polling to simulate real-time updates.
    // This will refetch the data every 3 seconds.
    refetchInterval: 3000, 
  });
};

// Pixel popup component for setting pixel colors
interface PixelPopupProps {
  x: number;
  y: number;
  currentColor: string;
  canvasId: string;
  onSetPixel: (x: number, y: number, color: number) => void;
  onClose: () => void;
}

const PixelPopup: React.FC<PixelPopupProps> = ({ x, y, currentColor, canvasId, onSetPixel, onClose }) => {
  const [selectedColor, setSelectedColor] = useState<string>(currentColor);
  const [colorComponent, setColorComponent] = useState<'red' | 'green' | 'blue' | 'grayscale'>('red');
  const [isSetting, setIsSetting] = useState(false);
  const [balance, setBalance] = useState<string>('0');
  const { evmAddress } = useEvmAddress();

  // Fetch balance when component mounts
  useEffect(() => {
    const fetchBalance = async () => {
      if (!evmAddress) return;
      try {
        const response = await fetch(`https://sepolia.base.org`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getBalance',
            params: [evmAddress, 'latest'],
            id: 1
          })
        });
        const data = await response.json();
        if (data.result) {
          const balanceInEth = (parseInt(data.result, 16) / 1e18).toFixed(6);
          setBalance(balanceInEth);
        }
      } catch (error) {
        console.error('Failed to fetch balance:', error);
      }
    };
    fetchBalance();
  }, [evmAddress]);

  const handleSetPixel = async () => {
    setIsSetting(true);
    // Convert hex color to uint8 (0-255)
    const colorNumber = parseInt(selectedColor.replace('#', ''), 16);
    // Ensure it's clamped to 8-bit range (0-255)
    const clampedColor = Math.max(0, Math.min(255, colorNumber));
    await onSetPixel(x, y, clampedColor);
    setIsSetting(false);
    onClose();
  };

  // Helper function to convert hex color to a single uint8 value
  const hexToUint8 = (hexColor: string, component: 'red' | 'green' | 'blue' | 'grayscale'): number => {
    // Remove the # if present
    const hex = hexColor.replace('#', '');
    
    if (component === 'grayscale') {
      // Convert to grayscale using luminance formula
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      return Math.max(0, Math.min(255, gray));
    } else {
      // Extract the specific color component
      const startIndex = component === 'red' ? 0 : component === 'green' ? 2 : 4;
      const componentValue = parseInt(hex.substring(startIndex, startIndex + 2), 16);
      return Math.max(0, Math.min(255, componentValue));
    }
  };

  // Create transaction data for setPixel
  const createSetPixelTransaction = (x: number, y: number, color: number) => {
    const chainId = 84532; // Base Sepolia chain ID
    const contractAddress = chainsToContracts[chainId]?.canvasGen;
    
    if (!contractAddress) {
      console.error('No contract address found for chain ID:', chainId);
      return null;
    }

    const data = encodeFunctionData({
      abi: canvasGenAbi,
      functionName: 'setPixel',
      args: [BigInt(canvasId), BigInt(x), BigInt(y), BigInt(color)],
    });

    return {
      to: contractAddress as `0x${string}`,
      data,
      value: 0n, // No ETH being sent
      gas: 500000n, // Estimate gas for contract interaction
      chainId: chainId,
      type: "eip1559" as const,
    };
  };

  const uint8Color = hexToUint8(selectedColor, colorComponent);
  const transaction = createSetPixelTransaction(x, y, uint8Color);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Set Pixel ({x}, {y})</h3>
        
        {/* Balance display */}
        <div className="mb-4 p-2 bg-gray-100 rounded-md">
          <p className="text-sm text-gray-600">
            Wallet Balance: <span className="font-semibold">{balance} ETH</span>
          </p>
          <p className="text-xs text-gray-500">
            Estimated gas cost: ~0.0002 ETH
          </p>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Color (Hex):
          </label>
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
            className="w-full h-10 border border-gray-300 rounded-md"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Color Component:
          </label>
          <select
            value={colorComponent}
            onChange={(e) => setColorComponent(e.target.value as 'red' | 'green' | 'blue' | 'grayscale')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="red">Red Component</option>
            <option value="green">Green Component</option>
            <option value="blue">Blue Component</option>
            <option value="grayscale">Grayscale</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Selected value: {uint8Color} (0-255)
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
          {transaction && evmAddress ? (
            <SendTransactionButton
              account={evmAddress}
              network="base-sepolia"
              transaction={transaction}
              onSuccess={() => {
                console.log('Pixel set successfully!');
                onClose();
              }}
              onError={(error) => {
                console.error('Failed to set pixel:', error);
                if (error.message?.includes('Insufficient balance')) {
                  alert(`Insufficient balance to execute the transaction.\n\nYour current balance: ${balance} ETH\n\nPlease ensure you have enough ETH to cover gas fees.`);
                } else {
                  alert(`Transaction failed: ${error.message}`);
                }
                setIsSetting(false);
              }}
              className="flex-1 px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors disabled:opacity-50"
            >
              {isSetting ? 'Setting...' : 'Set Pixel'}
            </SendTransactionButton>
          ) : (
            <button
              disabled
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed"
            >
              {!evmAddress ? 'No Wallet' : 'Invalid Transaction'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// A simple spinner component using an inline SVG to avoid external dependencies.
const Spinner = () => (
    <div className="animate-spin mr-2 inline-block">
        <svg
            className="w-5 h-5 text-zinc-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            ></circle>
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
        </svg>
    </div>
);

/**
 * Main component to display and manage the pixel canvas.
 * It fetches canvas dimensions and pixel data from a GraphQL endpoint.
 */
export default function App() {
  const [canvasId, setCanvasId] = useState<string>("1"); // Default to canvas 1
  const [inputCanvasId, setInputCanvasId] = useState<string>("1"); // For the input field
  const { evmAddress } = useEvmAddress();
  
  // For now, hardcode to Anvil chain ID (31337) since we're using local development
  const chainId = 84532;
  const canvasGenAddress = useMemo(() => {
    return (chainsToContracts[chainId]?.canvasGen) || null;
  }, [chainId]);

  // State for transaction handling
  const [isPixelSet, setIsPixelSet] = useState(false);

  // State for pixel popup
  const [selectedPixel, setSelectedPixel] = useState<{ x: number; y: number } | null>(null);
  const [showGrid, setShowGrid] = useState(true); // Add grid toggle state
  const [hoveredPixel, setHoveredPixel] = useState<{ x: number; y: number } | null>(null); // Add hover state
  const [availableCanvases, setAvailableCanvases] = useState<Array<{canvasId: string, x: number, y: number}>>([]);

  // --- Step 1: Fetch canvas dimensions (x and y) ---
  const {
    data: dimensionsData,
    isLoading: isLoadingDimensions,
    error: dimensionsError,
  } = useGraphQLQuery(GET_CANVAS_DIMENSIONS_QUERY, { canvasId });

  // --- Step 1.5: Fetch all available canvases ---
  const {
    data: allCanvasesData,
    isLoading: isLoadingAllCanvases,
    error: allCanvasesError,
  } = useGraphQLQuery(GET_ALL_CANVASES_QUERY, {});

  // Update available canvases when data is fetched
  useEffect(() => {
    if (allCanvasesData?.data?.allCanvasGenerateds?.nodes) {
      console.log('Fetched canvases:', allCanvasesData.data.allCanvasGenerateds.nodes);
      setAvailableCanvases(allCanvasesData.data.allCanvasGenerateds.nodes);
    }
  }, [allCanvasesData]);

  // Log any errors with canvas fetching
  useEffect(() => {
    if (allCanvasesError) {
      console.error('Error fetching canvases:', allCanvasesError);
    }
  }, [allCanvasesError]);

  // Extract dimensions from the fetched data
  const dimensions = dimensionsData?.data?.allCanvasGenerateds?.nodes[0];
  const width = dimensions?.x || 0;
  const height = dimensions?.y || 0;

  // --- Step 2: Fetch and update pixel data ---
  const { data: pixelData, isLoading: isLoadingPixels, error: pixelsError } = useGraphQLQuery(
    GET_PIXEL_DATA_QUERY,
    { canvasId }
  );

  // State to hold the pixel grid data
  const [pixelGrid, setPixelGrid] = useState<Record<string, string>>({});

  // Use a ref to track the latest block number to ensure we only get new pixels
  // This helps to avoid unnecessary state updates if no new pixels have been colored
  const lastKnownBlock = React.useRef(0);

  // Effect to update the pixel grid whenever new pixel data arrives
  useEffect(() => {
    if (pixelData?.data?.allPixelColoreds?.nodes) {
      const newPixels = pixelData.data.allPixelColoreds.nodes;
      
      // Filter for pixels that are newer than the last known block
      const latestBlockNumber = newPixels.reduce((max: number, p: any) => Math.max(max, parseInt(p.blockNumber)), 0);
      
      if (latestBlockNumber > lastKnownBlock.current) {
        setPixelGrid(prevGrid => {
          const updatedGrid = { ...prevGrid };
          newPixels.forEach((pixel: any) => {
            const key = `${pixel.x}-${pixel.y}`;
            updatedGrid[key] = pixel.color;
          });
          return updatedGrid;
        });
        lastKnownBlock.current = latestBlockNumber;
      }
    }
  }, [pixelData]);

  // Handle loading a new canvas
  const handleLoadCanvas = () => {
    if (inputCanvasId && inputCanvasId.trim() !== '') {
      setCanvasId(inputCanvasId.trim());
    }
  };

  // Create transaction for setting a pixel
  const createSetPixelTransaction = (x: number, y: number, color: number) => {
    if (!canvasGenAddress) {
      console.error('No contract address available');
      return null;
    }

    // Encode the function call data
    const functionData = encodeFunctionData({
      abi: canvasGenAbi,
      functionName: 'setPixel',
      args: [BigInt(canvasId), x, y, color],
    });

    return {
      to: canvasGenAddress as `0x${string}`,
      data: functionData,
      chainId: chainId, // Anvil chain ID
      type: "eip1559" as const,
    };
  };

  const handleTransactionError: SendTransactionButtonProps["onError"] = error => {
    console.error('Error setting pixel:', error);
  };

  const handleTransactionSuccess: SendTransactionButtonProps["onSuccess"] = hash => {
    console.log('Pixel set successfully:', hash);
    setIsPixelSet(true);
  };

  // Handle pixel click to show popup
  const handlePixelClick = (x: number, y: number) => {
    setSelectedPixel({ x, y });
  };

  // Close popup
  const closePopup = () => {
    setSelectedPixel(null);
  };

  // Use memoization to avoid re-rendering the pixel list unless the grid changes
  const pixelList = useMemo(() => {
    const pixels = [];
    console.log('Rendering pixels for grid:', { width, height });
    
    // Fix orientation: iterate by y first (rows), then x (columns)
    // Flip Y-axis so (0,0) is at bottom-left
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const key = `${x}-${y}`;
        const color = pixelGrid[key] || "transparent"; // Default to transparent if no color exists
        const isSelected = selectedPixel && selectedPixel.x === x && selectedPixel.y === y;
        const isHovered = hoveredPixel && hoveredPixel.x === x && hoveredPixel.y === y;
        
        // Flip Y coordinate: height - 1 - y to make (0,0) bottom-left
        const flippedY = height - 1 - y;
        
        pixels.push(
          <div
            key={key}
            className={`pixel cursor-pointer ${
              showGrid ? 'border border-gray-300' : 'border-0'
            } ${
              isSelected ? 'ring-2 ring-blue-500 ring-offset-1 z-10' : ''
            } ${
              isHovered ? 'ring-1 ring-blue-300 z-5' : ''
            }`}
            style={{ 
              backgroundColor: color === "transparent" ? "rgba(255, 255, 255, 0.1)" : `#${color}`,
              borderColor: showGrid ? 'rgba(0, 0, 0, 0.2)' : 'transparent',
              minWidth: '8px',
              minHeight: '8px',
              gridColumn: x + 1,
              gridRow: flippedY + 1, // Use flipped Y coordinate
            }}
            onClick={() => handlePixelClick(x, y)}
            onMouseEnter={() => setHoveredPixel({ x, y })}
            onMouseLeave={() => setHoveredPixel(null)}
            title={`Pixel (${x}, ${y}) - Color: ${color === "transparent" ? "transparent" : `#${color}`}`}
          />
        );
      }
    }
    console.log('Created', pixels.length, 'pixels');
    return pixels;
  }, [pixelGrid, width, height, showGrid, selectedPixel, hoveredPixel]);


  // --- Render logic based on data state ---
  if (isLoadingDimensions || isLoadingPixels) {
    return (
      <div className="flex items-center justify-center p-8 text-zinc-500">
        <Spinner />
        <p>Loading canvas dimensions and pixels...</p>
      </div>
    );
  }

  if (dimensionsError || pixelsError) {
    console.error("GraphQL Error:", dimensionsError || pixelsError);
    return (
      <div className="p-8 text-zinc-500">
        <p>Currently no canvases found</p>
      </div>
    );
  }

  // Handle case where no canvas is found
  if (!dimensions) {
    return (
      <div className="p-8 text-zinc-500">
        <p>Currently no canvases found</p>
      </div>
    );
  }

  // Dynamic grid styling based on dimensions
  const gridStyle = {
    gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${height}, minmax(0, 1fr))`,
    gap: '0px',
    width: '100%',
    height: '100%',
  };

  console.log('Grid dimensions:', { width, height, totalPixels: width * height });
  console.log('Grid style:', gridStyle);

  return (
    <div className="flex flex-col items-center p-4">
      <h1 className="text-2xl font-bold mb-4">Pixel Canvas</h1>
      
      {/* Canvas ID input */}
      <div className="flex items-center gap-2 mb-4">
        <label className="text-sm font-medium text-zinc-700">Canvas ID:</label>
        
        {/* Dropdown for available canvases */}
        <select
          value={inputCanvasId}
          onChange={(e) => setInputCanvasId(e.target.value)}
          className="px-3 py-1 border border-zinc-300 rounded-md text-sm focus:border-pink-500 focus:ring-pink-500"
          disabled={isLoadingAllCanvases}
        >
          <option value="">
            {isLoadingAllCanvases ? "Loading canvases..." : `Select a canvas (${availableCanvases.length} available)...`}
          </option>
          {availableCanvases.map((canvas) => (
            <option key={canvas.canvasId} value={canvas.canvasId}>
              Canvas {canvas.canvasId} ({canvas.x}×{canvas.y})
            </option>
          ))}
        </select>
        
        {/* Or enter manually */}
        <span className="text-sm text-zinc-500">or</span>
        <input
          type="text"
          value={inputCanvasId}
          onChange={(e) => setInputCanvasId(e.target.value)}
          placeholder="Enter canvas ID"
          className="px-3 py-1 border border-zinc-300 rounded-md text-sm focus:border-pink-500 focus:ring-pink-500"
        />
        <button
          onClick={handleLoadCanvas}
          className="px-3 py-1 bg-pink-500 text-white rounded-md text-sm hover:bg-pink-600 transition-colors"
        >
          Load Canvas
        </button>
      </div>
      
      {/* Canvas list status */}
      {isLoadingAllCanvases && (
        <p className="text-zinc-500 text-sm mb-2">Loading available canvases...</p>
      )}
      {allCanvasesError && (
        <p className="text-red-500 text-sm mb-2">Error loading canvases: {allCanvasesError.message}</p>
      )}
      
      <p className="text-zinc-600 mb-4">Viewing canvas ID: {canvasId}</p>
      
      {/* Grid toggle */}
      <div className="flex items-center gap-2 mb-4">
        <label className="text-sm font-medium text-zinc-700">Show Grid:</label>
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`px-3 py-1 rounded-md text-sm transition-colors ${
            showGrid 
              ? 'bg-blue-500 text-white hover:bg-blue-600' 
              : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
          }`}
        >
          {showGrid ? 'Hide Grid' : 'Show Grid'}
        </button>
      </div>
      
      {/* Canvas Section - Separated for better layout */}
      <div className="w-full mt-8">
        <div className="canvas-container w-full max-w-2xl aspect-square bg-gray-200 border border-gray-400 rounded-lg overflow-hidden">
          <div className={`pixel-grid grid w-full h-full ${showGrid ? 'show-grid' : ''}`} style={gridStyle}>
            {pixelList}
          </div>
        </div>
      </div>
      
      {/* Pixel popup */}
      {selectedPixel && (
        <PixelPopup
          x={selectedPixel.x}
          y={selectedPixel.y}
          currentColor={pixelGrid[`${selectedPixel.x}-${selectedPixel.y}`] || "#ffffff"}
          canvasId={canvasId}
          onSetPixel={(x, y, color) => {
            const transaction = createSetPixelTransaction(x, y, color);
            if (transaction && evmAddress) {
              // For now, just log the transaction - you can implement the actual sending later
              console.log('Transaction created:', transaction);
              closePopup();
            }
          }}
          onClose={closePopup}
        />
      )}
    </div>
  );
}