"use client";

import React, { useState, useMemo } from "react";
import { useAccount } from "wagmi";
import { useActiveListings } from "@/blockchain/hooks/useCarMarketplace";
import ListingCard from "./ListingCard";
import ListCarForm from "./ListCarForm";

// Basic Loading Spinner Component (can be reused or moved to a shared location)
const LoadingSpinner: React.FC<{ className?: string }> = ({
  className = "h-8 w-8",
}) => (
  <div
    className={`animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 ${className}`}
    role="status"
    aria-label="loading"
  ></div>
);

const MarketplaceClient: React.FC = () => {
  const { isConnected } = useAccount();
  const { listings, isLoading, error, refetch } = useActiveListings();
  const [showListForm, setShowListForm] = useState(false);

  // --- Filtering State ---
  const [filterMake, setFilterMake] = useState("");
  const [filterModel, setFilterModel] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterSeller, setFilterSeller] = useState("");

  // --- Filtering Logic ---
  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      const car = listing.carDetails;
      // Normalize inputs for case-insensitive comparison
      const makeLower = filterMake.toLowerCase();
      const modelLower = filterModel.toLowerCase();
      const sellerLower = filterSeller.toLowerCase();
      const yearStr = filterYear.toString(); // Ensure year is string for comparison

      // Check each filter condition
      const makeMatch =
        !makeLower || (car?.make?.toLowerCase().includes(makeLower) ?? false);
      const modelMatch =
        !modelLower ||
        (car?.model?.toLowerCase().includes(modelLower) ?? false);
      // Use toString() for year comparison as it's a bigint
      const yearMatch =
        !yearStr || (car?.year?.toString().includes(yearStr) ?? false);
      const sellerMatch =
        !sellerLower ||
        (listing.seller?.toLowerCase().includes(sellerLower) ?? false);

      return makeMatch && modelMatch && yearMatch && sellerMatch;
    });
  }, [listings, filterMake, filterModel, filterYear, filterSeller]);

  const handleListSuccess = () => {
    setShowListForm(false);
    refetch(); // Refresh the listings after successful listing
  };

  // --- Render Logic ---
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-10">
          <LoadingSpinner />
          <span className="ml-4 text-slate-600">Loading listings...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div
          className="p-4 bg-red-100 border border-red-400 text-red-700 rounded text-center"
          role="alert"
        >
          <strong className="font-bold mr-2">Error:</strong>
          <span>{error.message}</span>
          <button
            onClick={() => refetch()}
            className="ml-4 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
          >
            Retry
          </button>
        </div>
      );
    }

    if (filteredListings.length === 0) {
      return (
        <p className="text-center text-slate-500 py-10">
          No cars currently listed matching your filters.
        </p>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredListings.map((listing) => (
          <ListingCard
            key={listing.tokenId.toString()} // Use tokenId as key
            listing={listing}
            onPurchaseSuccess={refetch} // Pass refetch to refresh list after purchase
            onCancelSuccess={refetch} // Pass refetch to refresh list after cancellation
          />
        ))}
      </div>
    );
  };

  const inputClasses =
    "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";
  const labelClasses = "block text-sm font-medium text-gray-700";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-slate-800">Car Marketplace</h1>
        {isConnected && (
          <button
            onClick={() => setShowListForm(!showListForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200 text-sm"
          >
            {showListForm ? "Hide Form" : "List Your Car"}
          </button>
        )}
      </div>

      {showListForm && (
        <div className="mb-8 p-6 bg-white rounded-lg shadow border border-gray-200">
          <h2 className="text-xl font-semibold text-slate-700 mb-4">
            List Your Car for Sale
          </h2>
          <ListCarForm onSuccess={handleListSuccess} />
        </div>
      )}

      {/* --- Filtering UI --- */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-slate-700 mb-3">
          Filter Listings
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="filterMake" className={labelClasses}>
              Make
            </label>
            <input
              id="filterMake"
              type="text"
              value={filterMake}
              onChange={(e) => setFilterMake(e.target.value)}
              placeholder="e.g., Toyota"
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="filterModel" className={labelClasses}>
              Model
            </label>
            <input
              id="filterModel"
              type="text"
              value={filterModel}
              onChange={(e) => setFilterModel(e.target.value)}
              placeholder="e.g., Camry"
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="filterYear" className={labelClasses}>
              Year
            </label>
            <input
              id="filterYear"
              type="number"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              placeholder="e.g., 2020"
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="filterSeller" className={labelClasses}>
              Seller Address
            </label>
            <input
              id="filterSeller"
              type="text"
              value={filterSeller}
              onChange={(e) => setFilterSeller(e.target.value)}
              placeholder="e.g., 0x..."
              className={inputClasses}
            />
          </div>
        </div>
      </div>

      {renderContent()}
    </div>
  );
};

export default MarketplaceClient;
