import { useState, useMemo } from "react";
import { RiSparkling2Line } from "react-icons/ri";
import { useEvmAddress } from "@coinbase/cdp-hooks";
import {
  SendTransactionButton,
  type SendTransactionButtonProps,
} from "@coinbase/cdp-react/components/SendTransactionButton";
import { CgSpinner } from "react-icons/cg";
import { chainsToContracts, canvasGenAbi } from "../utils/constants";
import { InputForm } from "./ui/InputFormCanvasGen";
import { encodeFunctionData } from "viem";

// Interface for props if needed in the future
interface CanvasGenFormProps {
    // contractAddress?: 0x${string}
}

// Define the main component for generating the canvas
export default function CanvasGenForm({ /* contractAddress */ }: CanvasGenFormProps) {
    // Get the current user's address
    const { evmAddress } = useEvmAddress();
    
    // For now, hardcode to Anvil chain ID (31337) since we're using local development
    const chainId = 84532;

    // Determine the contract address dynamically based on the chain ID
    const canvasGenAddress = useMemo(() => {
        return (chainsToContracts[chainId]?.canvasGen) || null;
    }, [chainId]);

    // State variables for the form inputs
    const [x, setX] = useState<string>("");
    const [y, setY] = useState<string>("");
    const [maxDurationBlocks, setMaxDurationBlocks] = useState<string>("");
    
    // State for transaction handling
    const [transactionHash, setTransactionHash] = useState<string>("");
    const [error, setError] = useState<string>("");
    const [isGenerateConfirmed, setIsGenerateConfirmed] = useState(false);

    // Create transaction for canvas generation
    const generateCanvasTransaction = useMemo(() => {
        if (!canvasGenAddress || !x || !y || !maxDurationBlocks) {
            return null;
        }

        // Encode the function call data
        const functionData = encodeFunctionData({
            abi: canvasGenAbi,
            functionName: "generateCanvas",
            args: [parseInt(x), parseInt(y), BigInt(maxDurationBlocks)],
        });

        const transaction = {
            to: canvasGenAddress as `0x${string}`,
            data: functionData,
            value: 0n, // No ETH being sent
            gas: 500000n, // Estimate gas for contract interaction
            chainId: chainId, 
            type: "eip1559" as const,
        };

        console.log("Generated transaction:", transaction);
        return transaction;
    }, [canvasGenAddress, x, y, maxDurationBlocks]);

    const handleTransactionError: SendTransactionButtonProps["onError"] = error => {
        console.error("Transaction Error Details:", error);
        setTransactionHash("");
        setError(`Transaction failed: ${error.message}`);
        setIsGenerateConfirmed(false);
    };

    const handleTransactionSuccess: SendTransactionButtonProps["onSuccess"] = hash => {
        setTransactionHash(hash);
        setError("");
        setIsGenerateConfirmed(true);
    };
    
    // Check if transaction is ready
    const isTransactionReady = generateCanvasTransaction !== null && evmAddress;

    return (
        <div className="max-w-2xl min-w-full xl:min-w-lg w-full lg:mx-auto p-6 flex flex-col gap-6 bg-white rounded-xl ring-[4px] border-2 border-pink-500 ring-pink-500/25">
            {/* Main title section */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-zinc-900">Canvas Generator</h2>
            </div>

            {/* Form section */}
            <div className="space-y-6">
                <div className="bg-white border border-zinc-300 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-zinc-900 mb-3">Create a new canvas</h3>

                    {/* Input fields for Canvas details */}
                    <div className="flex flex-col gap-3">
                        <InputForm
                            label="X dimension"
                            placeholder="e.g., 100"
                            value={x}
                            onChange={(e:any) => setX(e.target.value)}
                        />
                        <InputForm
                            label="Y dimension"
                            placeholder="e.g., 100"
                            value={y}
                            onChange={(e:any) => setY(e.target.value)}
                        />
                        <InputForm
                            label="Max Duration Blocks"
                            placeholder="e.g., 5760"
                            value={maxDurationBlocks}
                            onChange={(e:any) => setMaxDurationBlocks(e.target.value)}
                        />
                    </div>

                    {/* The main button to trigger the smart contract call */}
                    {isTransactionReady && generateCanvasTransaction && (
                        <SendTransactionButton
                            account={evmAddress}
                            network="base-sepolia"
                            transaction={generateCanvasTransaction}
                            onError={handleTransactionError}
                            onSuccess={handleTransactionSuccess}
                            className="mt-4 cursor-pointer flex items-center justify-center w-full py-3 rounded-[9px] text-white transition-colors font-semibold relative border bg-pink-500 hover:bg-pink-600 border-pink-500"
                        >
                            <div className="flex items-center justify-center gap-2">
                                <RiSparkling2Line size={20} />
                                <span>Generate Canvas</span>
                            </div>
                        </SendTransactionButton>
                    )}
                    
                    {!isTransactionReady && (
                        <button
                            className="mt-4 cursor-pointer flex items-center justify-center w-full py-3 rounded-[9px] text-white transition-colors font-semibold relative border bg-gray-400 border-gray-400"
                            disabled
                        >
                            <span>Fill in all fields to generate canvas</span>
                        </button>
                    )}

                    {/* Display a success message after transaction confirmation */}
                    {isGenerateConfirmed && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-700">
                                <span className="font-medium">Success!</span>
                                <br />
                                Your canvas has been generated.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

