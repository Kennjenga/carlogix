"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Wrench,
  FileText,
  AlertCircle,
  Loader,
  RefreshCw,
  Printer,
} from "lucide-react";
import { usePublicClient } from "wagmi";
import { carnft_abi, carnft_address } from "@/blockchain/abi/neuro";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Address } from "viem";

// Contract details
const CARNFT_ADDRESS = carnft_address as Address;

// Minimal ABI with just the function we need
const CARNFT_ABI = carnft_abi;

// Cache duration in milliseconds (30 minutes)
const CACHE_DURATION = 30 * 60 * 1000;

// In-memory cache for maintenance records
interface CachedData {
  timestamp: number;
  records: MaintenanceRecord[];
}
const recordsCache: Record<string, CachedData> = {};

// Define the MaintenanceRecord type
interface MaintenanceRecord {
  timestamp: bigint;
  description: string;
  serviceProvider: string;
  mileage: bigint;
  documentURI: string;
}

interface MaintenanceRecordsListProps {
  tokenId: string;
}

const MaintenanceRecordsList: React.FC<MaintenanceRecordsListProps> = ({
  tokenId,
}) => {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [lastFetched, setLastFetched] = useState<number>(0);

  // Use Wagmi's public client
  const client = usePublicClient();

  // Function to fetch maintenance records
  const fetchMaintenanceRecords = useCallback(
    async (force = false) => {
      if (!tokenId || !client) return; // Ensure client is available

      // Check if we have cached data that's not expired
      const cacheKey = `token-${tokenId}`;
      const cachedData = recordsCache[cacheKey];
      const now = Date.now();

      if (
        !force && // Not a forced refresh
        cachedData && // We have cached data
        now - cachedData.timestamp < CACHE_DURATION // Cache isn't expired
      ) {
        console.log("Using cached maintenance records for token:", tokenId);
        setRecords(cachedData.records);
        setLastFetched(cachedData.timestamp);
        setIsLoading(false);
        setIsError(false);
        return;
      }

      try {
        setIsLoading(true);
        setIsError(false);
        setErrorMessage("");

        console.log(`Fetching maintenance records for token: ${tokenId}`);
        console.log(`Using contract address: ${CARNFT_ADDRESS}`);
        console.log(
          `Using public client from Wagmi for chain: ${client.chain.id}`
        );

        // Make the contract call using the Wagmi client
        const result = await client.readContract({
          address: CARNFT_ADDRESS,
          abi: CARNFT_ABI,
          functionName: "getMaintenanceRecords",
          args: [BigInt(tokenId)],
        });

        console.log("Records fetched successfully:", result);

        // Update state
        setRecords(result as MaintenanceRecord[]);
        setIsLoading(false);

        // Update cache
        const fetchTime = Date.now();
        setLastFetched(fetchTime);
        recordsCache[cacheKey] = {
          timestamp: fetchTime,
          records: result as MaintenanceRecord[],
        };
      } catch (err) {
        console.error("Error fetching maintenance records:", err);
        setIsError(true);
        // Extract a more specific error message if possible
        let detailedError = "An unknown error occurred.";
        if (err instanceof Error) {
          detailedError = err.message;
        }
        setErrorMessage(detailedError);
        setIsLoading(false);
      }
    },
    [tokenId, client] // Add client to dependency array
  );

  // Fetch records when component mounts or tokenId/client changes
  useEffect(() => {
    fetchMaintenanceRecords();
  }, [fetchMaintenanceRecords]);

  // Handle manual refresh button click
  const handleRefresh = () => {
    fetchMaintenanceRecords(true); // Force a refresh
  };

  // Format the last fetched time
  const formatLastFetched = () => {
    if (!lastFetched) return "";

    const date = new Date(lastFetched);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  // Handle print records functionality
  const handlePrintRecords = () => {
    const doc = new jsPDF();
    const title = "Vehicle Maintenance History";

    // Add title
    doc.setFontSize(16);
    doc.text(title, 14, 20);

    // Add timestamp
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    const tableData = sortedRecords.map((record) => [
      new Date(Number(record.timestamp) * 1000).toLocaleDateString(),
      record.description,
      record.serviceProvider,
      record.mileage.toString() + " miles",
      record.documentURI ? "Yes" : "No",
    ]);

    autoTable(doc, {
      head: [
        ["Date", "Description", "Service Provider", "Mileage", "Documentation"],
      ],
      body: tableData,
      startY: 35,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save(`maintenance-history-${tokenId}.pdf`);
  };

  // Display loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader size={24} className="animate-spin text-blue-600 mr-2" />
        <span className="text-blue-600">Loading maintenance records...</span>
      </div>
    );
  }

  // Display error state with detailed information
  if (isError) {
    return (
      <div className="rounded-md bg-red-50 p-4 mb-4">
        <div className="flex">
          <AlertCircle size={16} className="h-5 w-5 text-red-400" />
          <div className="ml-3 overflow-hidden">
            <h3 className="text-sm font-medium text-red-800">
              Error loading maintenance records
            </h3>
            {errorMessage && (
              <div className="text-xs text-red-700 mt-1 overflow-auto max-h-32">
                <p>{errorMessage}</p>
              </div>
            )}
            <button
              onClick={handleRefresh}
              className="mt-2 px-3 py-1 bg-red-100 text-red-800 rounded-md text-sm flex items-center"
            >
              <RefreshCw size={14} className="mr-1" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check if records is not an array or is empty
  if (!Array.isArray(records) || records.length === 0) {
    return (
      <div className="rounded-md bg-gray-50 p-4 mb-4 border border-gray-200">
        <div className="flex justify-center items-center py-4">
          <Wrench size={20} className="text-gray-400 mr-2" />
          <p className="text-gray-500">
            No maintenance records found for this vehicle.
          </p>
        </div>
      </div>
    );
  }

  // Sort records by timestamp (newest first)
  const sortedRecords = [...records].sort(
    (a, b) => Number(b.timestamp) - Number(a.timestamp)
  );

  // Helper function to format IPFS URI
  const formatIPFSLink = (uri: string): string | undefined => {
    if (!uri) return undefined;

    if (uri.startsWith("ipfs://")) {
      return `https://ipfs.io/ipfs/${uri.replace("ipfs://", "")}`;
    }
    return uri;
  };

  return (
    <div className="border border-gray-200 rounded-md overflow-hidden">
      <div className="bg-blue-50 p-2 border-b border-gray-200 flex justify-between items-center">
        <div>
          <span className="text-blue-700 font-medium">
            {sortedRecords.length} maintenance records found
          </span>
          {lastFetched > 0 && (
            <span className="text-xs text-gray-500 ml-2">
              Last updated: {formatLastFetched()}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrintRecords}
            className="text-blue-600 hover:text-blue-800 p-1 rounded flex items-center gap-1"
            title="Print maintenance records"
          >
            <Printer size={16} />
            <span className="text-sm">Print</span>
          </button>
          <button
            onClick={handleRefresh}
            className="text-blue-600 hover:text-blue-800 p-1 rounded"
            title="Refresh maintenance records"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>
      <ul className="divide-y divide-gray-200">
        {sortedRecords.map((record, index) => (
          <li key={index} className="p-4 hover:bg-gray-50">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center">
                <Wrench size={16} className="text-blue-500 mr-2" />
                <span className="font-medium">
                  {record.description.substring(0, 40)}
                  {record.description.length > 40 ? "..." : ""}
                </span>
              </div>
              <span className="text-sm text-gray-500">
                {new Date(Number(record.timestamp) * 1000).toLocaleDateString()}
              </span>
            </div>
            <div className="ml-6 text-sm text-gray-600 grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <span className="font-medium">Service Provider:</span>{" "}
                {record.serviceProvider}
              </div>
              <div>
                <span className="font-medium">Mileage:</span>{" "}
                {record.mileage.toString()} miles
              </div>
              {record.documentURI && (
                <div className="md:col-span-2 mt-2">
                  <a
                    href={formatIPFSLink(record.documentURI)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <FileText size={14} className="mr-1" />
                    View Documentation
                  </a>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MaintenanceRecordsList;
