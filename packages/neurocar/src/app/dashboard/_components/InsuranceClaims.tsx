"use client";

// app/dashboard/_components/InsuranceClaims.tsx
import React, { useState, useEffect, JSX } from "react";
import { useCarClaims } from "@/blockchain/hooks/useContractReads";
import { useCarInsuranceData } from "@/blockchain/hooks/useCarInsurance";
import { useAccount } from "wagmi";
import {
  AlertCircle,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
  Plus,
  DollarSign,
} from "lucide-react";
import { ClaimStatus } from "@/types";
import IPFSUpload from "./IPFSUpload";

interface InsuranceClaimsProps {
  tokenId: string;
}

const InsuranceClaims: React.FC<InsuranceClaimsProps> = ({ tokenId }) => {
  useAccount();
  const { data, isLoading: claimsLoading } = useCarClaims(BigInt(tokenId), 296);
  const claimIds = data as bigint[] | undefined;

  const carInsurance = useCarInsuranceData(296);

  // State variables
  interface Claim {
    claimId: bigint;
    status: number;
    description: string;
    createdAt: string;
    amount: bigint;
    payoutAmount: bigint;
    assignedAssessor: string;
    evidenceURI?: string;
  }

  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showFileClaim, setShowFileClaim] = useState<boolean>(false);
  const [selectedPoolId, setSelectedPoolId] = useState<string>("");
  const [ipfsUrl, setIpfsUrl] = useState<string>("");

  // Form state
  const [claimForm, setClaimForm] = useState({
    amount: "",
    description: "",
    evidenceURI: "",
  });

  // Status text and color mapping
  const statusMap: Record<
    number,
    { text: string; color: string; icon: JSX.Element }
  > = {
    [ClaimStatus.Pending]: {
      text: "Pending",
      color: "bg-yellow-100 text-yellow-800",
      icon: <Clock size={14} className="mr-1" />,
    },
    [ClaimStatus.UnderAssessment]: {
      text: "Under Assessment",
      color: "bg-blue-100 text-blue-800",
      icon: <Clock size={14} className="mr-1" />,
    },
    [ClaimStatus.AssessorApproved]: {
      text: "Assessor Approved",
      color: "bg-green-100 text-green-800",
      icon: <CheckCircle size={14} className="mr-1" />,
    },
    [ClaimStatus.AssessorRejected]: {
      text: "Assessor Rejected",
      color: "bg-red-100 text-red-800",
      icon: <XCircle size={14} className="mr-1" />,
    },
    [ClaimStatus.Approved]: {
      text: "Approved",
      color: "bg-green-100 text-green-800",
      icon: <CheckCircle size={14} className="mr-1" />,
    },
    [ClaimStatus.Rejected]: {
      text: "Rejected",
      color: "bg-red-100 text-red-800",
      icon: <XCircle size={14} className="mr-1" />,
    },
    [ClaimStatus.Paid]: {
      text: "Paid",
      color: "bg-green-100 text-green-800",
      icon: <DollarSign size={14} className="mr-1" />,
    },
    [ClaimStatus.UnderReview]: {
      text: "Under Review",
      color: "bg-purple-100 text-purple-800",
      icon: <Clock size={14} className="mr-1" />,
    },
  };

  // Load claim details for each claim ID
  useEffect(() => {
    const fetchClaimDetails = async () => {
      if (!claimIds || claimIds.length === 0) {
        setClaims([]);
        setLoading(false);
        return;
      }

      try {
        const claimDetailsPromises = claimIds.map((id) =>
          fetch(`/api/claims/${id}`).then((res) => res.json())
        );

        const claimDetails = await Promise.all(claimDetailsPromises);

        setClaims(claimDetails.filter((c) => c)); // Filter out any null values
      } catch (error) {
        console.error("Error loading claim details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!claimsLoading && claimIds) {
      fetchClaimDetails();
    }
  }, [claimIds, claimsLoading]);

  // Handle IPFS file upload completion
  const handleFileUpload = (url: string) => {
    setIpfsUrl(url);
  };

  // Handle filing a new claim
  const handleFileClaim = async () => {
    if (!selectedPoolId || !claimForm.amount || !claimForm.description) return;

    try {
      setLoading(true);

      // Use the ipfsUrl or manually entered evidenceURI
      const evidenceURI = ipfsUrl || claimForm.evidenceURI;

      await carInsurance.fileClaim(
        BigInt(selectedPoolId),
        // Convert ETH to Wei
        BigInt(parseFloat(claimForm.amount) * 10 ** 18),
        claimForm.description,
        evidenceURI
      );

      // Reset form
      setClaimForm({
        amount: "",
        description: "",
        evidenceURI: "",
      });
      setIpfsUrl("");
      setShowFileClaim(false);
    } catch (error) {
      console.error("Error filing claim:", error);
    } finally {
      setLoading(false);
    }
  };

  // Format a bigint value as ETH
  const formatEth = (value: bigint) => {
    return (Number(value) / 10 ** 18).toFixed(4);
  };

  // Display loading state
  if (loading || claimsLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader size={24} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={() => setShowFileClaim(!showFileClaim)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus size={16} className="mr-2" />
          File New Claim
        </button>
      </div>

      {/* File Claim Form */}
      {showFileClaim && (
        <div className="mb-6 border border-gray-200 rounded-lg shadow-sm bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              File Insurance Claim
            </h3>
          </div>
          <div className="px-6 py-4">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="poolSelect"
                  className="block text-sm font-medium text-gray-700"
                >
                  Select Insurance Pool
                </label>
                <select
                  id="poolSelect"
                  value={selectedPoolId}
                  onChange={(e) => setSelectedPoolId(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select a pool</option>
                  {/* This would be populated from your available pools */}
                  <option value="1">Pool #1</option>
                  <option value="2">Pool #2</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="amount"
                  className="block text-sm font-medium text-gray-700"
                >
                  Claim Amount (Hbar)
                </label>
                <input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={claimForm.amount}
                  onChange={(e) =>
                    setClaimForm({ ...claimForm, amount: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={claimForm.description}
                  onChange={(e) =>
                    setClaimForm({ ...claimForm, description: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Please describe what happened and why you're filing this claim..."
                />
              </div>
              <div>
                <label
                  htmlFor="evidenceURI"
                  className="block text-sm font-medium text-gray-700"
                >
                  Evidence URI (optional)
                </label>
                <input
                  id="evidenceURI"
                  type="text"
                  value={claimForm.evidenceURI}
                  onChange={(e) =>
                    setClaimForm({ ...claimForm, evidenceURI: e.target.value })
                  }
                  placeholder="Use IPFS upload below instead"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Upload Evidence to IPFS
                </label>
                <div className="mt-2">
                  <IPFSUpload onUploadComplete={handleFileUpload} />
                </div>
                {ipfsUrl && (
                  <div className="mt-2 p-4 bg-green-50 rounded-md border border-green-200">
                    <div className="flex">
                      <CheckCircle
                        size={16}
                        className="h-5 w-5 text-green-400 mr-2"
                      />
                      <div>
                        <h3 className="text-sm font-medium text-green-800">
                          File Uploaded
                        </h3>
                        <div className="mt-1 text-sm text-green-700 truncate">
                          {ipfsUrl}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="px-6 py-3 bg-gray-50 text-right flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowFileClaim(false)}
              className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleFileClaim}
              disabled={
                loading ||
                !selectedPoolId ||
                !claimForm.amount ||
                !claimForm.description
              }
              className={`inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                loading ||
                !selectedPoolId ||
                !claimForm.amount ||
                !claimForm.description
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? (
                <>
                  <Loader size={16} className="animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Plus size={16} className="mr-2" />
                  Submit Claim
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Claims List */}
      {claims.length === 0 ? (
        <div className="rounded-md bg-gray-50 p-4 mb-4 border border-gray-200">
          <div className="flex justify-center items-center py-4">
            <CheckCircle size={20} className="text-green-500 mr-2" />
            <p className="text-gray-500">
              No claims have been filed for this vehicle.
            </p>
          </div>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-md overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {claims.map((claim, index) => (
              <li key={index} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center">
                    <AlertCircle size={16} className="text-blue-500 mr-2" />
                    <span className="font-medium">
                      Claim #{claim.claimId.toString()}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        statusMap[claim.status]?.color ||
                        "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {statusMap[claim.status]?.icon}
                      {statusMap[claim.status]?.text || "Unknown"}
                    </span>
                  </div>
                </div>
                <div className="ml-6 space-y-2">
                  <p className="text-sm text-gray-600">{claim.description}</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div className="text-gray-500">
                      <span className="font-medium">Filed:</span>{" "}
                      {new Date(
                        Number(claim.createdAt) * 1000
                      ).toLocaleDateString()}
                    </div>
                    <div className="text-gray-500">
                      <span className="font-medium">Requested Amount:</span>{" "}
                      {formatEth(claim.amount)} ETH
                    </div>
                    {claim.payoutAmount > 0 && (
                      <div className="text-gray-500">
                        <span className="font-medium">Payout Amount:</span>{" "}
                        {formatEth(claim.payoutAmount)} ETH
                      </div>
                    )}
                    {claim.assignedAssessor &&
                      claim.assignedAssessor !==
                        "0x0000000000000000000000000000000000000000" && (
                        <div className="text-gray-500">
                          <span className="font-medium">Assessor:</span>{" "}
                          {`${claim.assignedAssessor.slice(
                            0,
                            6
                          )}...${claim.assignedAssessor.slice(-4)}`}
                        </div>
                      )}
                  </div>
                  {claim.evidenceURI && (
                    <div className="flex items-center mt-2">
                      <a
                        href={
                          claim.evidenceURI.includes("ipfs://")
                            ? `https://ipfs.io/ipfs/${claim.evidenceURI.replace(
                                "ipfs://",
                                ""
                              )}`
                            : claim.evidenceURI
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                      >
                        <FileText size={14} className="mr-1" />
                        View Evidence
                      </a>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default InsuranceClaims;
