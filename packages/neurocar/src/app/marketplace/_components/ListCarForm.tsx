"use client";

import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { parseUnits } from "viem";
import { useUserCars } from "@/blockchain/hooks/useUserCars"; // Hook to get user's NFTs
import {
  useListCar,
  useApproveMarketplace,
} from "@/blockchain/hooks/useCarMarketplace";

interface ListCarFormProps {
  onSuccess: () => void; // Callback on successful listing
}

// Basic Loading Spinner Component
const LoadingSpinner: React.FC<{ className?: string }> = ({
  className = "h-4 w-4",
}) => (
  <div
    className={`animate-spin rounded-full border-2 border-white border-t-transparent ${className}`}
    role="status"
    aria-label="loading"
  ></div>
);

// Basic Icons (using simple text/emoji for brevity)
const InfoIcon = () => <span className="mr-1">ℹ️</span>;
const SuccessIcon = () => <span className="mr-1">✅</span>;
const ErrorIcon = () => <span className="mr-1">❌</span>;

const ListCarForm: React.FC<ListCarFormProps> = ({ onSuccess }) => {
  const { address: connectedAddress } = useAccount();
  const {
    cars: userCars,
    loading: isLoadingUserCars,
    error: userCarsError,
  } = useUserCars(connectedAddress);

  const [selectedTokenId, setSelectedTokenId] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<{
    type: "info" | "error" | "success";
    message: string;
  } | null>(null);

  const tokenIdBigInt = selectedTokenId ? BigInt(selectedTokenId) : undefined;
  const priceBigInt = price ? parseUnits(price, 6) : undefined; // Assuming 6 decimals for USDT

  // --- NFT Approval Hook ---
  const {
    approveMarketplace,
    needsApproval: needsNftApproval,
    isApproving: isApprovingNft,
    isConfirmingApproval: isConfirmingNftApproval,
    isApproved: isNftApproved,
    approvalHash: nftApprovalHash,
    approvalError: nftApprovalError,
    clearApprovalError: clearNftApprovalError,
    isLoadingApprovalStatus: isLoadingNftApprovalStatus,
  } = useApproveMarketplace(tokenIdBigInt);

  // --- List Car Hook ---
  const {
    listCar,
    isListing,
    isConfirming: isConfirmingListing,
    isConfirmed: isListingConfirmed,
    hash: listingHash,
    error: listingError,
    clearError: clearListingError,
  } = useListCar();

  // --- Effects for Status Updates ---
  useEffect(() => {
    if (isApprovingNft) {
      setStatusMessage({
        type: "info",
        message: "Requesting NFT approval for Marketplace...",
      });
    } else if (isConfirmingNftApproval) {
      setStatusMessage({
        type: "info",
        message: `Confirming NFT approval... Tx: ${nftApprovalHash?.slice(
          0,
          10
        )}...`,
      });
    } else if (isNftApproved && nftApprovalHash) {
      setStatusMessage({
        type: "success",
        message: `NFT Approved for Marketplace! Tx: ${nftApprovalHash?.slice(
          0,
          10
        )}...`,
      });
    } else if (nftApprovalError) {
      setStatusMessage({
        type: "error",
        message: `NFT Approval Failed: ${nftApprovalError.message}`,
      });
    }
  }, [
    isApprovingNft,
    isConfirmingNftApproval,
    isNftApproved,
    nftApprovalHash,
    nftApprovalError,
  ]);

  useEffect(() => {
    if (isListing) {
      setStatusMessage({ type: "info", message: "Initiating listing..." });
    } else if (isConfirmingListing) {
      setStatusMessage({
        type: "info",
        message: `Confirming listing... Tx: ${listingHash?.slice(0, 10)}...`,
      });
    } else if (isListingConfirmed) {
      setStatusMessage({
        type: "success",
        message: `Car Listed Successfully! Tx: ${listingHash?.slice(0, 10)}...`,
      });
      onSuccess();
      setSelectedTokenId("");
      setPrice("");
      setDescription("");
    } else if (listingError) {
      setStatusMessage({
        type: "error",
        message: `Listing Failed: ${listingError.message}`,
      });
    }
  }, [
    isListing,
    isConfirmingListing,
    isListingConfirmed,
    listingHash,
    listingError,
    onSuccess,
  ]);

  // --- Event Handlers ---
  const handleApproveNft = async () => {
    if (!tokenIdBigInt) return;
    clearNftApprovalError();
    setStatusMessage({
      type: "info",
      message: "Please confirm NFT approval in your wallet.",
    });
    await approveMarketplace();
  };

  const handleListCar = async () => {
    if (!tokenIdBigInt || !priceBigInt) return;
    clearListingError();
    setStatusMessage({
      type: "info",
      message: "Please confirm the listing in your wallet.",
    });
    await listCar({
      tokenId: tokenIdBigInt,
      price: priceBigInt,
      description: description,
      onError: (err) =>
        setStatusMessage({
          type: "error",
          message: `Listing Error: ${err.message}`,
        }),
    });
  };

  const clearStatus = () => {
    setStatusMessage(null);
    clearNftApprovalError();
    clearListingError();
  };

  // --- Render Logic ---
  if (isLoadingUserCars) {
    return (
      <div className="flex items-center text-slate-600">
        <LoadingSpinner className="mr-2 h-4 w-4 border-blue-500 border-t-transparent" />{" "}
        Loading your cars...
      </div>
    );
  }

  if (userCarsError) {
    return (
      <div
        className="p-4 bg-red-100 border border-red-400 text-red-700 rounded"
        role="alert"
      >
        <strong className="font-bold mr-2">Error:</strong>
        <span className="block sm:inline">
          Could not load your cars: {userCarsError}
        </span>
      </div>
    );
  }

  if (!userCars || userCars.length === 0) {
    return (
      <p className="text-slate-600">
        You do not seem to own any Car NFTs to list.
      </p>
    );
  }

  const renderButton = () => {
    const baseButtonClasses =
      "px-4 py-2 rounded text-white transition duration-200 flex items-center justify-center text-sm";
    const disabledButtonClasses = "bg-gray-400 cursor-not-allowed";
    const blueButtonClasses = "bg-blue-600 hover:bg-blue-700";
    const greenButtonClasses = "bg-green-600 hover:bg-green-700";

    if (!selectedTokenId || !price) {
      return (
        <button
          disabled
          className={`${baseButtonClasses} ${disabledButtonClasses}`}
        >
          Select Car and Enter Price
        </button>
      );
    }
    if (isLoadingNftApprovalStatus) {
      return (
        <button
          disabled
          className={`${baseButtonClasses} ${disabledButtonClasses}`}
        >
          <LoadingSpinner className="mr-2 h-4 w-4" />
          Checking Approval...
        </button>
      );
    }
    if (needsNftApproval) {
      return (
        <button
          onClick={handleApproveNft}
          disabled={isApprovingNft || isConfirmingNftApproval}
          className={`${baseButtonClasses} ${blueButtonClasses} ${
            isApprovingNft || isConfirmingNftApproval
              ? "opacity-70 cursor-wait"
              : ""
          }`}
        >
          {(isApprovingNft || isConfirmingNftApproval) && (
            <LoadingSpinner className="mr-2 h-4 w-4" />
          )}
          Approve Marketplace for this Car
        </button>
      );
    }
    return (
      <button
        onClick={handleListCar}
        disabled={isListing || isConfirmingListing || isListingConfirmed}
        className={`${baseButtonClasses} ${greenButtonClasses} ${
          isListing || isConfirmingListing || isListingConfirmed
            ? "opacity-70 cursor-wait"
            : ""
        }`}
      >
        {(isListing || isConfirmingListing) && (
          <LoadingSpinner className="mr-2 h-4 w-4" />
        )}
        {isListingConfirmed ? "Listed!" : "List Car for Sale"}
      </button>
    );
  };

  const getStatusIcon = () => {
    if (!statusMessage) return null;
    switch (statusMessage.type) {
      case "info":
        return <InfoIcon />;
      case "success":
        return <SuccessIcon />;
      case "error":
        return <ErrorIcon />;
      default:
        return null;
    }
  };

  const getAlertClasses = () => {
    if (!statusMessage) return "";
    switch (statusMessage.type) {
      case "info":
        return "bg-blue-100 border-blue-500 text-blue-700";
      case "success":
        return "bg-green-100 border-green-500 text-green-700";
      case "error":
        return "bg-red-100 border-red-500 text-red-700";
      default:
        return "bg-gray-100 border-gray-500 text-gray-700";
    }
  };

  const inputClasses =
    "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";
  const labelClasses = "block text-sm font-medium text-gray-700";

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="tokenId" className={labelClasses}>
          Select Car to List
        </label>
        <select
          id="tokenId"
          value={selectedTokenId}
          onChange={(e) => setSelectedTokenId(e.target.value)}
          className={inputClasses}
        >
          <option value="" disabled>
            Select a car NFT
          </option>
          {userCars.map((car) => (
            <option key={car.tokenId.toString()} value={car.tokenId.toString()}>
              {/* Access properties directly, check for 'make' as an indicator */}
              {car.make
                ? `${car.year} ${car.make} ${car.model} (ID: ${car.tokenId})`
                : `Token ID: ${car.tokenId}`}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="price" className={labelClasses}>
          Price (USDT)
        </label>
        <input
          id="price"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="e.g., 15000.50"
          min="0"
          step="0.01"
          className={inputClasses}
        />
        <p className="text-xs text-slate-500 mt-1">
          Enter the price in USDT. The contract uses 6 decimals.
        </p>
      </div>

      <div>
        <label htmlFor="description" className={labelClasses}>
          Description (Optional)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add any details about the car..."
          rows={3}
          className={inputClasses}
        />
      </div>

      {statusMessage && (
        <div
          className={`mt-4 p-3 border-l-4 rounded ${getAlertClasses()}`}
          role="alert"
        >
          <div className="flex items-center">
            {getStatusIcon()}
            <span className="font-bold mr-2 text-sm">
              {statusMessage.type.toUpperCase()}
            </span>
            <p className="flex-grow text-sm">{statusMessage.message}</p>
            <button
              onClick={clearStatus}
              className="ml-2 text-xs font-semibold hover:opacity-80"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-end pt-4 border-t border-gray-200 mt-6">
        {renderButton()}
      </div>
    </div>
  );
};

export default ListCarForm;
