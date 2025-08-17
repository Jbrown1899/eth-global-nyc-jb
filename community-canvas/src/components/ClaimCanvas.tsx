import React, { useState, useEffect } from 'react';
import { useEvmAddress } from '@coinbase/cdp-hooks';
import {
  SendTransactionButton,
  type SendTransactionButtonProps,
} from "@coinbase/cdp-react/components/SendTransactionButton";
import { chainsToContracts, canvasGenAbi } from '../utils/constants';
import { encodeFunctionData } from "viem";

interface ClaimCanvasProps {
  canvasId: string;
  isComplete: boolean;
  isClaimed: boolean;
  owner: string;
  onClaimSuccess?: () => void;
}

export default function ClaimCanvas({ 
  canvasId, 
  isComplete, 
  isClaimed, 
  owner, 
  onClaimSuccess 
}: ClaimCanvasProps) {
  const { evmAddress } = useEvmAddress();
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [imageCid, setImageCid] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);

  // Determine if current user is the owner
  const isOwner = evmAddress?.toLowerCase() === owner.toLowerCase();
  
  // Determine if canvas can be claimed
  const canClaim = isComplete && !isClaimed && isOwner;

  // Create transaction for claiming canvas
  const createClaimTransaction = () => {
    if (!imageCid.trim()) {
      console.error('Image CID is required');
      return null;
    }

    const chainId = 84532; // Base Sepolia
    const canvasGenAddress = chainsToContracts[chainId]?.canvasGen;
    
    if (!canvasGenAddress) {
      console.error('No contract address available');
      return null;
    }

    // Encode the function call data
    const functionData = encodeFunctionData({
      abi: canvasGenAbi,
      functionName: 'claim',
      args: [BigInt(canvasId), imageCid.trim()],
    });

    return {
      to: canvasGenAddress as `0x${string}`,
      data: functionData,
      value: 0n,
      gas: 500000n,
      chainId: chainId,
      type: "eip1559" as const,
    };
  };

  const handleTransactionError: SendTransactionButtonProps["onError"] = error => {
    console.error('Error claiming canvas:', error);
    setIsClaiming(false);
  };

  const handleTransactionSuccess: SendTransactionButtonProps["onSuccess"] = hash => {
    console.log('Canvas claimed successfully:', hash);
    setIsClaiming(false);
    setShowClaimForm(false);
    setImageCid('');
    if (onClaimSuccess) {
      onClaimSuccess();
    }
  };

  const handleClaimClick = () => {
    if (canClaim) {
      setShowClaimForm(true);
    }
  };

  const handleCancelClaim = () => {
    setShowClaimForm(false);
    setImageCid('');
  };

  // Don't render anything if canvas is not complete
  // For now, we'll show the component but with a note about missing data
  if (!isComplete && owner) {
    return null;
  }

  return (
    <div className="claim-canvas-container">
      {/* Development Note */}
      {!owner && (
        <div className="dev-note">
          <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
            ⚠️ Claim functionality is ready but requires rindexer schema update for completion status.
          </p>
        </div>
      )}
      
      {/* Status Badge */}
      <div className="canvas-status">
        {isClaimed ? (
          <span className="status-badge status-claimed">
            ✅ Claimed
          </span>
        ) : (
          <span className="status-badge status-complete">
            🎨 Complete - Ready to Claim
          </span>
        )}
      </div>

      {/* Claim Button */}
      {!isClaimed && (
        <div className="claim-section">
          {isOwner ? (
            <button
              onClick={handleClaimClick}
              disabled={!canClaim}
              className={`claim-button ${canClaim ? 'claim-button--enabled' : 'claim-button--disabled'}`}
            >
              {canClaim ? '🎯 Claim Canvas' : '⏳ Waiting for completion...'}
            </button>
          ) : (
            <div className="claim-info">
              <span className="claim-owner">
                Owner: {owner.slice(0, 6)}...{owner.slice(-4)}
              </span>
              <button
                disabled
                className="claim-button claim-button--disabled"
              >
                🔒 Only owner can claim
              </button>
            </div>
          )}
        </div>
      )}

      {/* Claim Form Modal */}
      {showClaimForm && (
        <div className="claim-modal-overlay">
          <div className="claim-modal">
            <h3 className="claim-modal-title">Claim Canvas #{canvasId}</h3>
            <p className="claim-modal-description">
              Provide the IPFS CID of your completed canvas image to claim it as an NFT.
            </p>
            
            <div className="claim-form">
              <label htmlFor="imageCid" className="claim-label">
                Image CID (IPFS):
              </label>
              <input
                id="imageCid"
                type="text"
                value={imageCid}
                onChange={(e) => setImageCid(e.target.value)}
                placeholder="QmX... (IPFS CID)"
                className="claim-input"
              />
              <p className="claim-help">
                Upload your canvas image to IPFS and paste the CID here.
              </p>
            </div>

            <div className="claim-actions">
              <button
                onClick={handleCancelClaim}
                className="claim-button claim-button--secondary"
                disabled={isClaiming}
              >
                Cancel
              </button>
              {createClaimTransaction() && evmAddress && (
                <SendTransactionButton
                  account={evmAddress}
                  network="base-sepolia"
                  transaction={createClaimTransaction()!}
                  onError={handleTransactionError}
                  onSuccess={handleTransactionSuccess}
                  disabled={!imageCid.trim() || isClaiming}
                  className="claim-button claim-button--primary"
                >
                  {isClaiming ? 'Claiming...' : 'Claim Canvas'}
                </SendTransactionButton>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
