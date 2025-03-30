"use client";

import React from "react";
import { useMaintenanceRecords } from "@/blockchain/hooks/useContractReads";
import { Wrench, FileText, AlertCircle, Loader } from "lucide-react";
import { MaintenanceRecord } from "@/types";

interface MaintenanceRecordsListProps {
  tokenId: string;
}

const MaintenanceRecordsList: React.FC<MaintenanceRecordsListProps> = ({
  tokenId,
}) => {
  const {
    data: records,
    isLoading,
    isError,
    refetch,
  } = useMaintenanceRecords(BigInt(tokenId), 296);

  // Display loading state
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader size={24} className="animate-spin text-blue-600" />
      </div>
    );
  }

  // Display error state
  if (isError || !records) {
    return (
      <div className="rounded-md bg-red-50 p-4 mb-4">
        <div className="flex">
          <AlertCircle size={16} className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error loading maintenance records
            </h3>
            <button
              onClick={() => refetch?.()}
              className="mt-2 px-3 py-1 bg-red-100 text-red-800 rounded-md text-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Display empty state
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
  const sortedRecords = [...(records as MaintenanceRecord[])].sort(
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
