"use client";

import React from "react";
import { useIssueReports } from "@/blockchain/hooks/useContractReads";
import { useCarNFTData } from "@/blockchain/hooks/useCarNFT";
import { IssueReport } from "@/types";
import {
  AlertTriangle,
  FileText,
  CheckCircle,
  Loader,
  XCircle,
} from "lucide-react";

interface IssueReportsListProps {
  tokenId: string;
}

const IssueReportsList: React.FC<IssueReportsListProps> = ({ tokenId }) => {
  const {
    data: reports,
    isLoading,
    isError,
    refetch,
  } = useIssueReports(BigInt(tokenId), 296);

  const carNFT = useCarNFTData(296);

  // Handle resolving an issue
  const handleResolveIssue = async (reportIndex: number) => {
    try {
      await carNFT.resolveIssue(BigInt(tokenId), reportIndex);
      // Refetch after resolving the issue
      setTimeout(() => refetch?.(), 2000);
    } catch (error) {
      console.error("Error resolving issue:", error);
    }
  };

  // Display loading state
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader size={24} className="animate-spin text-blue-600" />
      </div>
    );
  }

  // Display error state
  if (isError || !reports) {
    return (
      <div className="rounded-md bg-red-50 p-4 mb-4">
        <div className="flex">
          <XCircle size={16} className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error loading issue reports
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
  if (!Array.isArray(reports) || reports.length === 0) {
    return (
      <div className="rounded-md bg-gray-50 p-4 mb-4 border border-gray-200">
        <div className="flex justify-center items-center py-4">
          <CheckCircle size={20} className="text-green-500 mr-2" />
          <p className="text-gray-500">No issues reported for this vehicle.</p>
        </div>
      </div>
    );
  }

  // Sort reports by timestamp (newest first)
  const sortedReports = [...(reports as IssueReport[])].sort(
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
        {sortedReports.map((report, index) => (
          <li
            key={index}
            className={`p-4 hover:bg-gray-50 ${
              report.resolved ? "bg-green-50" : ""
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center">
                {report.resolved ? (
                  <CheckCircle size={16} className="text-green-500 mr-2" />
                ) : (
                  <AlertTriangle size={16} className="text-amber-500 mr-2" />
                )}
                <span className="font-medium">{report.issueType}</span>
              </div>
              <span className="text-sm text-gray-500">
                {new Date(Number(report.timestamp) * 1000).toLocaleDateString()}
              </span>
            </div>
            <div className="ml-6 space-y-2">
              <p className="text-sm text-gray-600">{report.description}</p>

              <div className="flex justify-between items-center mt-2">
                {report.evidenceURI && (
                  <a
                    href={formatIPFSLink(report.evidenceURI)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                  >
                    <FileText size={14} className="mr-1" />
                    View Evidence
                  </a>
                )}

                {!report.resolved && (
                  <button
                    onClick={() => handleResolveIssue(index)}
                    className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <CheckCircle size={12} className="mr-1" />
                    Mark as Resolved
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default IssueReportsList;
