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

// GraphQL query to get the canvas dimensions (X and Y)
const GET_CANVAS_DIMENSIONS_QUERY = `
  query GetCanvasDimensions($canvasId: String!) {
    allCanvasGenerateds(condition: { canvasId: $canvasId }) {
      nodes {
        configX
        configY
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
const useGraphQLQuery = (query: string, variables: Record<string, any>) => {
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
    enabled: !!variables.canvasId,
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
  onSetPixel: (x: number, y: number, color: number) => void;
  onClose: () => void;
}

const PixelPopup: React.FC<PixelPopupProps> = ({ x, y, currentColor, onSetPixel, onClose }) => {
  const [selectedColor, setSelectedColor] = useState<string>(currentColor);
  const [isSetting, setIsSetting] = useState(false);

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Set Pixel ({x}, {y})</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Color:</label>
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
            className="w-full h-10 border border-gray-300 rounded cursor-pointer"
          />
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            disabled={isSetting}
          >
            Cancel
          </button>
          <button
            onClick={handleSetPixel}
            className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 disabled:opacity-50"
            disabled={isSetting}
          >
            {isSetting ? 'Setting...' : 'Set Pixel'}
          </button>
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

  // --- Step 1: Fetch canvas dimensions (x and y) ---
  const { data: dimensionsData, isLoading: isLoadingDimensions, error: dimensionsError } = useGraphQLQuery(
    GET_CANVAS_DIMENSIONS_QUERY,
    { canvasId }
  );

  // Extract dimensions from the fetched data
  const dimensions = dimensionsData?.data?.allCanvasGenerateds?.nodes[0];
  const width = dimensions?.configX || 0;
  const height = dimensions?.configY || 0;

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
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const key = `${x}-${y}`;
        const color = pixelGrid[key] || "transparent"; // Default to transparent if no color exists
        pixels.push(
          <div
            key={key}
            className="pixel cursor-pointer"
            style={{ backgroundColor: color === "transparent" ? "transparent" : `#${color}` }}
            onClick={() => handlePixelClick(x, y)}
          />
        );
      }
    }
    return pixels;
  }, [pixelGrid, width, height]);


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
  };

  return (
    <div className="flex flex-col items-center p-4">
      <h1 className="text-2xl font-bold mb-4">Pixel Canvas</h1>
      
      {/* Canvas ID input */}
      <div className="flex items-center gap-2 mb-4">
        <label className="text-sm font-medium text-zinc-700">Canvas ID:</label>
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
      
      <p className="text-zinc-600 mb-4">Viewing canvas ID: {canvasId}</p>
      <div className="canvas-container w-full max-w-xl aspect-square bg-gray-200 border border-gray-400 rounded-lg overflow-hidden">
        <div className="pixel-grid grid w-full h-full" style={gridStyle}>
          {pixelList}
        </div>
      </div>
      
      {/* Pixel popup */}
      {selectedPixel && (
        <PixelPopup
          x={selectedPixel.x}
          y={selectedPixel.y}
          currentColor={pixelGrid[`${selectedPixel.x}-${selectedPixel.y}`] || "#ffffff"}
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