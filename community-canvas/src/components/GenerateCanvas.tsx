import { useState, useMemo, useEffect } from "react";
import { RiSparkling2Line } from "react-icons/ri";
import {
    useChainId,
    useWriteContract,
    useAccount,
    useWaitForTransactionReceipt,
} from "wagmi";
import { CgSpinner } from "react-icons/cg";
import { chainsToContracts, canvasGenAbi } from "../utils/constants";
import { InputForm } from "./ui/InputFormCanvasGen";

// Interface for props if needed in the future
interface CanvasGenFormProps {
    // contractAddress?: 0x${string}
}

// Define the main component for generating the canvas
export default function CanvasGenForm({ /* contractAddress */ }: CanvasGenFormProps) {
    // Get the current user's address and the active chain ID
    const { address } = useAccount();
    const chainId = useChainId();

    // Determine the contract address dynamically based on the chain ID
    const canvasGenAddress = useMemo(() => {
        // The type `0x${string}` is a TypeScript type, and cannot be used in the return statement.
        // It's handled by wagmi hooks directly, so we can safely remove it here.
        return (chainsToContracts[chainId]?.canvasGen) || null;
    }, [chainId]);

    // State variables for the form inputs
    const [x, setX] = useState<string>("");
    const [y, setY] = useState<string>("");
    const [maxDurationBlocks, setMaxDurationBlocks] = useState<string>("");
    
    // State to hold the transaction hash for waiting for the receipt
    const [transactionHash, setTransactionHash] = useState<`0x${string}` | null>(null);

    // Use wagmi's useWriteContract hook to prepare the transaction
    const {
        data: generateCanvasHash,
        isPending: isGeneratePending,
        error: generateCanvasError,
        writeContractAsync: writeGenerateCanvasAsync,
    } = useWriteContract();

    // Use wagmi's useWaitForTransactionReceipt to monitor the transaction
    const {
        isLoading: isGenerateConfirming,
        isSuccess: isGenerateConfirmed,
        isError: isGenerateError,
    } = useWaitForTransactionReceipt({
        confirmations: 1,
        hash: generateCanvasHash,
    });

    // Handle the button click to generate the canvas
    const handleGenerateCanvas = async () => {
        // Ensure the contract address exists and inputs are valid
        if (!canvasGenAddress || !x || !y || !maxDurationBlocks) {
            console.error("Missing contract address or input values.");
            return;
        }

        try {
            // Call the generateCanvas function on the smart contract
            const txHash = await writeGenerateCanvasAsync({
                abi: canvasGenAbi,
                address: canvasGenAddress as `0x${string}`,
                functionName: "generateCanvas",
                args: [parseInt(x), parseInt(y), BigInt(maxDurationBlocks)],
            });
            console.log("Canvas generation transaction submitted:", txHash);
            setTransactionHash(txHash); // Store the hash to track the transaction
        } catch (error) {
            console.error("Error generating canvas:", error);
        }
    };
    
    // Helper function to dynamically update the button content based on the state
    function getButtonContent() {
        if (isGeneratePending) {
            return (
                <div className="flex items-center justify-center gap-2 w-full">
                    <CgSpinner className="animate-spin" size={20} />
                    <span>Confirming in wallet...</span>
                </div>
            );
        }
        if (isGenerateConfirming) {
            return (
                <div className="flex items-center justify-center gap-2 w-full">
                    <CgSpinner className="animate-spin" size={20} />
                    <span>Generating your canvas...</span>
                </div>
            );
        }
        if (generateCanvasError || isGenerateError) {
            console.error("Transaction Error:", generateCanvasError);
            return (
                <div className="flex items-center justify-center gap-2 w-full">
                    <span>Error generating canvas, see console.</span>
                </div>
            );
        }
        if (isGenerateConfirmed) {
            return "Canvas generated successfully!";
        }
        return (
            <div className="flex items-center justify-center gap-2">
                <RiSparkling2Line size={20} />
                <span>Generate Canvas</span>
            </div>
        );
    }

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
                    <button
                        className="mt-4 cursor-pointer flex items-center justify-center w-full py-3 rounded-[9px] text-white transition-colors font-semibold relative border bg-pink-500 hover:bg-pink-600 border-pink-500"
                        onClick={handleGenerateCanvas}
                        disabled={isGeneratePending || isGenerateConfirming}
                    >
                        {/* Gradient and inner shadow for styling */}
                        <div className="absolute w-full inset-0 bg-gradient-to-b from-white/25 via-80% to-transparent mix-blend-overlay z-10 rounded-lg" />
                        <div className="absolute w-full inset-0 mix-blend-overlay z-10 inner-shadow rounded-lg" />
                        <div className="absolute w-full inset-0 mix-blend-overlay z-10 border-[1.5px] border-white/20 rounded-lg" />
                        {getButtonContent()}
                    </button>

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

