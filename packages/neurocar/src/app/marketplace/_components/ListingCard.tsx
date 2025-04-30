"use client";

import React, { useState } from "react";
// import { type Address } from "viem";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import Image from "next/image";
import {
  Listing,
  usePurchaseCar,
  useCancelListing,
  useApproveUsdt,
} from "@/blockchain/hooks/useCarMarketplace";
// import { useApproveMarketplace } from "@/blockchain/hooks/useCarMarketplace"; // Import NFT approval hook

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

interface ListingCardProps {
  listing: Listing;
  onPurchaseSuccess: () => void; // Callback on successful purchase
  onCancelSuccess: () => void; // Callback on successful cancellation
}

const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  onPurchaseSuccess,
  onCancelSuccess,
}) => {
  const { address: connectedAddress, isConnected } = useAccount();
  const [statusMessage, setStatusMessage] = useState<{
    type: "info" | "error" | "success";
    message: string;
  } | null>(null);

  const { carDetails, price, seller, tokenId } = listing;
  const priceInUSDT = formatUnits(price, 6); // Assuming 6 decimals for USDT

  const isOwner =
    isConnected && connectedAddress?.toLowerCase() === seller?.toLowerCase();

  // --- Purchase Hook ---
  const {
    purchaseCar,
    isPurchasing,
    isConfirming: isConfirmingPurchase,
    isConfirmed: isPurchaseConfirmed,
    clearError: clearPurchaseError,
  } = usePurchaseCar();

  // --- USDT Approval Hook ---
  const {
    approveUsdt,
    needsApproval: needsUsdtApproval,
    isApproving: isApprovingUsdt,
    isConfirmingApproval: isConfirmingUsdtApproval,
    // Removing unused variable: isApproved: isUsdtApproved,
    approvalError: usdtApprovalError,
    clearApprovalError: clearUsdtApprovalError,
    isLoadingAllowanceStatus: isLoadingUsdtAllowance,
  } = useApproveUsdt(price); // Pass the price to check/approve

  // --- Cancel Listing Hook ---
  const {
    cancelListing,
    isCancelling,
    isConfirming: isConfirmingCancel,
    isConfirmed: isCancelConfirmed,
    // Removing unused variable: error: cancelError,
    clearError: clearCancelError,
  } = useCancelListing();

  // --- Event Handlers ---
  const handleApproveUsdt = async () => {
    clearUsdtApprovalError();
    setStatusMessage({
      type: "info",
      message: "Requesting USDT approval... Please confirm in your wallet.",
    });
    await approveUsdt();
    if (usdtApprovalError) {
      setStatusMessage({
        type: "error",
        message: `USDT Approval Failed: ${usdtApprovalError.message}`,
      });
    } else {
      // Don't show success here, wait for confirmation effect
    }
  };

  const handlePurchase = async () => {
    clearPurchaseError();
    setStatusMessage({
      type: "info",
      message: "Initiating purchase... Please confirm in your wallet.",
    });
    await purchaseCar({
      tokenId,
      onSuccess: () => {
        setStatusMessage({
          type: "success",
          message: "Purchase successful! Refreshing listings...",
        });
        onPurchaseSuccess(); // Callback to refresh list
      },
      onError: (err) =>
        setStatusMessage({
          type: "error",
          message: `Purchase Failed: ${err.message}`,
        }),
    });
  };

  const handleCancelListing = async () => {
    clearCancelError();
    setStatusMessage({
      type: "info",
      message: "Initiating cancellation... Please confirm in your wallet.",
    });
    await cancelListing({
      tokenId,
      onSuccess: () => {
        setStatusMessage({
          type: "success",
          message: "Listing cancelled successfully! Refreshing listings...",
        });
        onCancelSuccess(); // Callback to refresh list
      },
      onError: (err) =>
        setStatusMessage({
          type: "error",
          message: `Cancellation Failed: ${err.message}`,
        }),
    });
  };

  const clearStatus = () => {
    setStatusMessage(null);
    clearPurchaseError();
    clearCancelError();
    clearUsdtApprovalError();
  };

  // --- Render Button Logic ---
  const renderActionButton = () => {
    const baseButtonClasses =
      "w-full px-4 py-2 rounded text-white transition duration-200 flex items-center justify-center text-sm font-medium";
    const disabledButtonClasses = "bg-gray-400 cursor-not-allowed";
    const blueButtonClasses = "bg-blue-600 hover:bg-blue-700";
    const greenButtonClasses = "bg-green-600 hover:bg-green-700";
    const redButtonClasses = "bg-red-600 hover:bg-red-700";

    if (!isConnected) {
      return (
        <button
          disabled
          className={`${baseButtonClasses} ${disabledButtonClasses}`}
        >
          Connect Wallet to Interact
        </button>
      );
    }

    // Owner Actions
    if (isOwner) {
      return (
        <button
          onClick={handleCancelListing}
          disabled={isCancelling || isConfirmingCancel || isCancelConfirmed}
          className={`${baseButtonClasses} ${redButtonClasses} ${
            isCancelling || isConfirmingCancel ? "opacity-70 cursor-wait" : ""
          }`}
        >
          {(isCancelling || isConfirmingCancel) && (
            <LoadingSpinner className="mr-2 h-4 w-4" />
          )}
          {isCancelConfirmed ? "Cancelled" : "Cancel Listing"}
        </button>
      );
    }

    // Buyer Actions
    if (isLoadingUsdtAllowance) {
      return (
        <button
          disabled
          className={`${baseButtonClasses} ${disabledButtonClasses}`}
        >
          <LoadingSpinner className="mr-2 h-4 w-4" />
          Checking USDT Allowance...
        </button>
      );
    }

    if (needsUsdtApproval) {
      return (
        <button
          onClick={handleApproveUsdt}
          disabled={isApprovingUsdt || isConfirmingUsdtApproval}
          className={`${baseButtonClasses} ${blueButtonClasses} ${
            isApprovingUsdt || isConfirmingUsdtApproval
              ? "opacity-70 cursor-wait"
              : ""
          }`}
        >
          {(isApprovingUsdt || isConfirmingUsdtApproval) && (
            <LoadingSpinner className="mr-2 h-4 w-4" />
          )}
          Approve USDT Spending
        </button>
      );
    }

    return (
      <button
        onClick={handlePurchase}
        disabled={isPurchasing || isConfirmingPurchase || isPurchaseConfirmed}
        className={`${baseButtonClasses} ${greenButtonClasses} ${
          isPurchasing || isConfirmingPurchase ? "opacity-70 cursor-wait" : ""
        }`}
      >
        {(isPurchasing || isConfirmingPurchase) && (
          <LoadingSpinner className="mr-2 h-4 w-4" />
        )}
        {isPurchaseConfirmed ? "Purchased!" : `Buy Now (${priceInUSDT} USDT)`}
      </button>
    );
  };

  // --- Status Message Display ---
  const getStatusIcon = () => {
    if (!statusMessage) return null;
    switch (statusMessage.type) {
      case "info":
        return <span className="mr-1">ℹ️</span>;
      case "success":
        return <span className="mr-1">✅</span>;
      case "error":
        return <span className="mr-1">❌</span>;
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

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 flex flex-col">
      <div className="h-48 bg-gray-200 flex items-center justify-center text-gray-500 relative">
        {carDetails?.imageURI ? (
          <Image
            src={carDetails.imageURI}
            alt={`${carDetails.make} ${carDetails.model}`}
            fill
            sizes="(max-width: 768px) 100vw, 384px"
            className="object-cover"
            priority
          />
        ) : (
          <span>No Image</span>
        )}
      </div>

      <div className="p-4 flex-grow flex flex-col">
        {carDetails ? ( // Check if carDetails is available
          <h3 className="text-lg font-semibold text-slate-800 mb-1">
            {carDetails.year?.toString()} {carDetails.make} {carDetails.model}
          </h3>
        ) : (
          <h3 className="text-lg font-semibold text-slate-800 mb-1">
            Car Details Unavailable
          </h3>
        )}
        <p className="text-sm text-slate-600 mb-1">
          Token ID: {tokenId.toString()}
        </p>
        <p className="text-sm text-slate-600 mb-3 truncate" title={seller}>
          Seller:{" "}
          {seller ? `${seller.slice(0, 6)}...${seller.slice(-4)}` : "N/A"}
        </p>

        <div className="mt-auto pt-3 border-t border-gray-100">
          <p className="text-xl font-bold text-slate-900 mb-3">
            {priceInUSDT}{" "}
            <span className="text-sm font-normal text-slate-500">USDT</span>
          </p>

          {/* Status Message Area */}
          {statusMessage && (
            <div
              className={`mb-3 p-2 border-l-4 rounded text-xs ${getAlertClasses()}`}
              role="alert"
            >
              <div className="flex items-center">
                {getStatusIcon()}
                <span className="font-bold mr-1">
                  {statusMessage.type.toUpperCase()}
                </span>
                <p className="flex-grow">{statusMessage.message}</p>
                <button
                  onClick={clearStatus}
                  className="ml-1 text-xs font-semibold hover:opacity-80"
                  aria-label="Dismiss message"
                >
                  &times;
                </button>
              </div>
            </div>
          )}

          {renderActionButton()}
        </div>
      </div>
    </div>
  );
};

export default ListingCard;
