import { useState } from "react";
import { useInsuranceDetails } from "@/blockchain/hooks/useCarNFT";
import { InsuranceDetail } from "@/types";
import IPFSUpload from "./IPFSUpload";

interface InsuranceDetailsProps {
  tokenId: bigint;
  currentInsurance?: InsuranceDetail | null;
  onUpdate?: () => void;
}

export function InsuranceDetails({
  tokenId,
  currentInsurance,
  onUpdate,
}: InsuranceDetailsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [policyNumber, setPolicyNumber] = useState("");
  const [provider, setProvider] = useState("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [documentURI, setDocumentURI] = useState("");

  const { processInsurance, isProcessing } = useInsuranceDetails();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return;

    const startTimestamp = new Date(startDate).getTime() / 1000;
    const endTimestamp = new Date(endDate).getTime() / 1000;

    await processInsurance({
      tokenId,
      policyNumber,
      provider,
      startDate: BigInt(Math.floor(startTimestamp)),
      endDate: BigInt(Math.floor(endTimestamp)),
      documentURI,
      isUpdate: !!currentInsurance,
      active: true,
      onSuccess: () => {
        if (onUpdate) onUpdate();
        // Reset form and close modal
        setPolicyNumber("");
        setProvider("");
        setStartDate("");
        setEndDate("");
        setDocumentURI("");
        setIsModalOpen(false);
      },
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Insurance Details</h3>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          {currentInsurance ? "Update Insurance" : "Add Insurance"}
        </button>
      </div>

      {currentInsurance ? (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-lg mb-4">Current Policy</h4>
          <div className="space-y-2">
            <p>
              <span className="font-medium">Policy Number:</span>{" "}
              {currentInsurance.policyNumber}
            </p>
            <p>
              <span className="font-medium">Provider:</span>{" "}
              {currentInsurance.provider}
            </p>
            <p>
              <span className="font-medium">Start Date:</span>{" "}
              {new Date(
                Number(currentInsurance.startDate) * 1000
              ).toLocaleDateString()}
            </p>
            <p>
              <span className="font-medium">End Date:</span>{" "}
              {new Date(
                Number(currentInsurance.endDate) * 1000
              ).toLocaleDateString()}
            </p>
            <p>
              <span className="font-medium">Status:</span>{" "}
              <span
                className={`${
                  currentInsurance.active ? "text-green-600" : "text-red-600"
                }`}
              >
                {currentInsurance.active ? "Active" : "Inactive"}
              </span>
            </p>
            {currentInsurance.documentURI && (
              <p>
                <span className="font-medium">Document:</span>{" "}
                <a
                  href={currentInsurance.documentURI}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View Document
                </a>
              </p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-gray-500">No insurance information available</p>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-lg">
                {currentInsurance ? "Update Insurance" : "Add Insurance"}
              </h4>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="policyNumber"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Policy Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="policyNumber"
                  type="text"
                  required
                  value={policyNumber}
                  onChange={(e) => setPolicyNumber(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="provider"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Provider <span className="text-red-500">*</span>
                </label>
                <input
                  id="provider"
                  type="text"
                  required
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="startDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="startDate"
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="endDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="endDate"
                  type="date"
                  required
                  min={startDate}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Insurance Document
                </label>
                <IPFSUpload onUploadComplete={(url) => setDocumentURI(url)} />
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className={`w-full px-4 py-2 text-white font-medium rounded-md ${
                  isProcessing
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                } transition-colors`}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </span>
                ) : currentInsurance ? (
                  "Update Insurance"
                ) : (
                  "Add Insurance"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
