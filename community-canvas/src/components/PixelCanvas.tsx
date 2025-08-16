import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
// No need to import CgSpinner from react-icons/cg as we are creating a custom spinner.

// The GraphQL endpoint URL. This should be replaced with your actual endpoint.
const GRAPHQL_ENDPOINT = 'YOUR_GRAPHQL_ENDPOINT_HERE';

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
const useGraphQLQuery = (query, variables) => {
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
  const canvasId = "0x89d246b45139a6225916035f29d28e75"; // Example canvasId

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
  const [pixelGrid, setPixelGrid] = useState({});

  // Use a ref to track the latest block number to ensure we only get new pixels
  // This helps to avoid unnecessary state updates if no new pixels have been colored
  const lastKnownBlock = React.useRef(0);

  // Effect to update the pixel grid whenever new pixel data arrives
  useEffect(() => {
    if (pixelData?.data?.allPixelColoreds?.nodes) {
      const newPixels = pixelData.data.allPixelColoreds.nodes;
      
      // Filter for pixels that are newer than the last known block
      const latestBlockNumber = newPixels.reduce((max, p) => Math.max(max, parseInt(p.blockNumber)), 0);
      
      if (latestBlockNumber > lastKnownBlock.current) {
        setPixelGrid(prevGrid => {
          const updatedGrid = { ...prevGrid };
          newPixels.forEach(pixel => {
            const key = `${pixel.x}-${pixel.y}`;
            updatedGrid[key] = pixel.color;
          });
          return updatedGrid;
        });
        lastKnownBlock.current = latestBlockNumber;
      }
    }
  }, [pixelData]);

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
            className="pixel"
            style={{ backgroundColor: `#${color.toString(16).padStart(6, '0')}` }}
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
      <div className="p-8 text-red-500">
        <p>Error loading canvas data. Please check the console for details.</p>
      </div>
    );
  }

  // Handle case where no canvas is found
  if (!dimensions) {
    return (
      <div className="p-8 text-red-500">
        <p>No canvas found with the provided ID: {canvasId}</p>
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
      <p className="text-zinc-600 mb-4">Viewing canvas ID: {canvasId}</p>
      <div className="canvas-container w-full max-w-xl aspect-square bg-gray-200 border border-gray-400 rounded-lg overflow-hidden">
        <div className="pixel-grid grid w-full h-full" style={gridStyle}>
          {pixelList}
        </div>
      </div>
    </div>
  );
}