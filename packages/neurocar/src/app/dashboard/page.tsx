"use client";

import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import {
  Car,
  Plus,
  Wrench,
  AlertTriangle,
  Shield,
  FileText,
  Loader,
} from "lucide-react";
import { CarWithId } from "@/types";
import MaintenanceRecordsList from "./_components/MaintenanceRecordsList";
import IssueReportsList from "./_components/IssueReportsList";
import InsurancePools from "./_components/InsurancePools";
import InsuranceClaims from "./_components/InsuranceClaims";
import { useUserCars } from "@/blockchain/hooks/useUserCars";
import { useCarNFTData } from "@/blockchain/hooks/useCarNFT";
import { useCarInsuranceData } from "@/blockchain/hooks/useCarInsurance";

export default function Dashboard() {
  const { address } = useAccount();

  // State for selected car and tab
  const [selectedCar, setSelectedCar] = useState<CarWithId | null>(null);
  const [activeTab, setActiveTab] = useState("maintenance");

  // State for loading indicators
  const [mintLoading, setMintLoading] = useState(false);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [issueLoading, setIssueLoading] = useState(false);

  // Form input states
  const [mintFormData, setMintFormData] = useState({
    make: "",
    model: "",
    year: "",
    vin: "",
    initialMileage: "",
    registrationNumber: "",
    metadataURI: "",
  });

  const [maintenanceFormData, setMaintenanceFormData] = useState({
    description: "",
    serviceProvider: "",
    mileage: "",
    documentURI: "",
  });

  const [issueFormData, setIssueFormData] = useState({
    issueType: "",
    description: "",
    evidenceURI: "",
  });

  // Modal states
  const [showMintModal, setShowMintModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);

  // Fetch user's cars
  const {
    cars: userCars,
    loading: carsLoading,
    error: carsError,
  } = useUserCars(address);

  // Contract interaction hooks
  const {
    mintCar,
    addMaintenanceRecord,
    reportIssue,
    lastCarMintedEvent,
    lastMaintenanceAddedEvent,
    lastIssueReportedEvent,
  } = useCarNFTData();

  const {
    // joinPool,
    // fileClaim,
    // lastPoolCreatedEvent,
    // lastMemberJoinedEvent,
    // lastClaimFiledEvent,
  } = useCarInsuranceData();

  // Set first car as selected on initial load
  useEffect(() => {
    if (userCars && userCars.length > 0 && !selectedCar) {
      setSelectedCar(userCars[0]);
    }
  }, [userCars, selectedCar]);

  // Refresh data when events are detected
  useEffect(() => {
    // This would trigger a refresh of the cars list when relevant events occur
    // In a real implementation, you might want to add more sophisticated logic
  }, [lastCarMintedEvent, lastMaintenanceAddedEvent, lastIssueReportedEvent]);

  // Handle minting a new car NFT
  const handleMintCar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !address ||
      !mintFormData.make ||
      !mintFormData.model ||
      !mintFormData.year ||
      !mintFormData.vin
    ) {
      alert("Please fill all required fields");
      return;
    }

    try {
      setMintLoading(true);
      await mintCar(
        address,
        mintFormData.vin,
        mintFormData.make,
        mintFormData.model,
        parseInt(mintFormData.year),
        mintFormData.registrationNumber || "",
        mintFormData.metadataURI || ""
      );

      // Reset form and close modal
      setMintFormData({
        make: "",
        model: "",
        year: "",
        vin: "",
        initialMileage: "",
        registrationNumber: "",
        metadataURI: "",
      });
      setShowMintModal(false);
    } catch (error) {
      console.error("Error minting car NFT:", error);
      alert("Failed to mint car NFT. See console for details.");
    } finally {
      setMintLoading(false);
    }
  };

  // Handle adding a maintenance record
  const handleAddMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !selectedCar ||
      !maintenanceFormData.description ||
      !maintenanceFormData.mileage
    ) {
      alert("Please select a car and fill all required fields");
      return;
    }

    try {
      setMaintenanceLoading(true);
      await addMaintenanceRecord(
        BigInt(selectedCar.id),
        maintenanceFormData.description,
        maintenanceFormData.serviceProvider || "Unknown",
        parseInt(maintenanceFormData.mileage),
        maintenanceFormData.documentURI || ""
      );

      // Reset form and close modal
      setMaintenanceFormData({
        description: "",
        serviceProvider: "",
        mileage: "",
        documentURI: "",
      });
      setShowMaintenanceModal(false);
    } catch (error) {
      console.error("Error adding maintenance record:", error);
      alert("Failed to add maintenance record. See console for details.");
    } finally {
      setMaintenanceLoading(false);
    }
  };

  // Handle reporting an issue
  const handleReportIssue = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !selectedCar ||
      !issueFormData.issueType ||
      !issueFormData.description
    ) {
      alert("Please select a car and fill all required fields");
      return;
    }

    try {
      setIssueLoading(true);
      await reportIssue(
        BigInt(selectedCar.id),
        issueFormData.issueType,
        issueFormData.description,
        issueFormData.evidenceURI || ""
      );

      // Reset form and close modal
      setIssueFormData({
        issueType: "",
        description: "",
        evidenceURI: "",
      });
      setShowIssueModal(false);
    } catch (error) {
      console.error("Error reporting issue:", error);
      alert("Failed to report issue. See console for details.");
    } finally {
      setIssueLoading(false);
    }
  };

  // Loading state
  if (carsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader size={32} className="animate-spin text-blue-600" />
        <span className="ml-2 text-lg text-gray-700">
          Loading your vehicles...
        </span>
      </div>
    );
  }

  // Error state
  if (carsError) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-50 p-4 rounded-md border border-red-200 max-w-md">
          <h2 className="text-lg font-medium text-red-800 mb-2">
            Error Loading Vehicles
          </h2>
          <p className="text-red-700">{carsError}</p>
          <button
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar with car list */}
        <div className="w-full md:w-1/4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                My Vehicles
              </h2>
              <button
                onClick={() => setShowMintModal(true)}
                className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                aria-label="Add new vehicle"
              >
                <Plus size={16} />
              </button>
            </div>

            {userCars && userCars.length > 0 ? (
              <div className="space-y-2">
                {userCars.map((car) => (
                  <div
                    key={car.id}
                    onClick={() => setSelectedCar(car)}
                    className={`p-3 rounded-md cursor-pointer transition-colors ${
                      selectedCar?.id === car.id
                        ? "bg-blue-50 border border-blue-200"
                        : "hover:bg-gray-50 border border-gray-100"
                    }`}
                  >
                    <div className="flex items-center">
                      <Car size={20} className="text-blue-600 mr-2" />
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {car.make} {car.model}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {car.year} • VIN: {car.vin.substring(0, 8)}...
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Car size={40} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">No vehicles found</p>
                <button
                  onClick={() => setShowMintModal(true)}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Add Your First Vehicle
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main content area */}
        <div className="w-full md:w-3/4">
          {selectedCar ? (
            <>
              {/* Car details header */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {selectedCar.make} {selectedCar.model}
                    </h1>
                    <p className="text-gray-500">
                      {selectedCar.year} • VIN: {selectedCar.vin}
                    </p>
                    <p className="text-gray-500">
                      Current Mileage: {selectedCar.mileage} miles
                    </p>
                  </div>
                  <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
                    <button
                      onClick={() => setShowMaintenanceModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                    >
                      <Wrench size={16} className="mr-2" />
                      Add Maintenance
                    </button>
                    <button
                      onClick={() => setShowIssueModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700"
                    >
                      <AlertTriangle size={16} className="mr-2" />
                      Report Issue
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab("maintenance")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "maintenance"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Wrench size={16} className="inline mr-2" />
                    Maintenance History
                  </button>
                  <button
                    onClick={() => setActiveTab("issues")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "issues"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <AlertTriangle size={16} className="inline mr-2" />
                    Issue Reports
                  </button>
                  <button
                    onClick={() => setActiveTab("insurance")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "insurance"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Shield size={16} className="inline mr-2" />
                    Insurance
                  </button>
                  <button
                    onClick={() => setActiveTab("claims")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "claims"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <FileText size={16} className="inline mr-2" />
                    Claims
                  </button>
                </nav>
              </div>

              {/* Tab content */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {activeTab === "maintenance" && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                      Maintenance Records
                    </h2>
                    <MaintenanceRecordsList tokenId={selectedCar.id} />
                  </div>
                )}

                {activeTab === "issues" && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                      Issue Reports
                    </h2>
                    <IssueReportsList tokenId={selectedCar.id} />
                  </div>
                )}

                {activeTab === "insurance" && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                      Insurance Pools
                    </h2>
                    <InsurancePools
                      pools={[
                        {
                          id: "1",
                          name: "Standard Coverage Pool",
                          description: "Basic coverage for most vehicles",
                          minContribution: BigInt(1000000000000000000), // 1 ETH
                          maxCoverage: BigInt(10000000000000000000), // 10 ETH
                          memberCount: 24,
                          totalFunds: BigInt(35000000000000000000), // 35 ETH
                        },
                        {
                          id: "2",
                          name: "Premium Coverage Pool",
                          description: "Enhanced coverage for luxury vehicles",
                          minContribution: BigInt(5000000000000000000), // 5 ETH
                          maxCoverage: BigInt(50000000000000000000), // 50 ETH
                          memberCount: 12,
                          totalFunds: BigInt(85000000000000000000), // 85 ETH
                        },
                      ]}
                      cars={userCars || []}
                      selectedCar={selectedCar}
                      loading={false}
                    />
                  </div>
                )}

                {activeTab === "claims" && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                      Insurance Claims
                    </h2>
                    <InsuranceClaims tokenId={selectedCar.id} />
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <Car size={48} className="mx-auto text-gray-300 mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                No Vehicle Selected
              </h2>
              <p className="text-gray-500 mb-6">
                Select a vehicle from the list or add a new one to get started.
              </p>
              <button
                onClick={() => setShowMintModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Add New Vehicle
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mint Car Modal */}
      {showMintModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Add New Vehicle
            </h2>
            <form onSubmit={handleMintCar}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Make
                  </label>
                  <input
                    type="text"
                    value={mintFormData.make}
                    onChange={(e) =>
                      setMintFormData({ ...mintFormData, make: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Model
                  </label>
                  <input
                    type="text"
                    value={mintFormData.model}
                    onChange={(e) =>
                      setMintFormData({
                        ...mintFormData,
                        model: e.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Year
                  </label>
                  <input
                    type="number"
                    value={mintFormData.year}
                    onChange={(e) =>
                      setMintFormData({ ...mintFormData, year: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                    min="1900"
                    max={new Date().getFullYear()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    VIN
                  </label>
                  <input
                    type="text"
                    value={mintFormData.vin}
                    onChange={(e) =>
                      setMintFormData({ ...mintFormData, vin: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Registration Number
                  </label>
                  <input
                    type="text"
                    value={mintFormData.registrationNumber}
                    onChange={(e) =>
                      setMintFormData({
                        ...mintFormData,
                        registrationNumber: e.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Initial Mileage
                  </label>
                  <input
                    type="number"
                    value={mintFormData.initialMileage}
                    onChange={(e) =>
                      setMintFormData({
                        ...mintFormData,
                        initialMileage: e.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Metadata URI (optional)
                  </label>
                  <input
                    type="text"
                    value={mintFormData.metadataURI}
                    onChange={(e) =>
                      setMintFormData({
                        ...mintFormData,
                        metadataURI: e.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="ipfs://..."
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowMintModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={mintLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                >
                  {mintLoading ? (
                    <>
                      <Loader size={16} className="inline animate-spin mr-2" />
                      Minting...
                    </>
                  ) : (
                    "Mint NFT"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Maintenance Modal */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Add Maintenance Record
            </h2>
            <form onSubmit={handleAddMaintenance}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={maintenanceFormData.description}
                    onChange={(e) =>
                      setMaintenanceFormData({
                        ...maintenanceFormData,
                        description: e.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Service Provider
                  </label>
                  <input
                    type="text"
                    value={maintenanceFormData.serviceProvider}
                    onChange={(e) =>
                      setMaintenanceFormData({
                        ...maintenanceFormData,
                        serviceProvider: e.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Mileage
                  </label>
                  <input
                    type="number"
                    value={maintenanceFormData.mileage}
                    onChange={(e) =>
                      setMaintenanceFormData({
                        ...maintenanceFormData,
                        mileage: e.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Document URI (optional)
                  </label>
                  <input
                    type="text"
                    value={maintenanceFormData.documentURI}
                    onChange={(e) =>
                      setMaintenanceFormData({
                        ...maintenanceFormData,
                        documentURI: e.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="ipfs://..."
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowMaintenanceModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={maintenanceLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-green-400"
                >
                  {maintenanceLoading ? (
                    <>
                      <Loader size={16} className="inline animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Add Record"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Issue Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Report Vehicle Issue
            </h2>
            <form onSubmit={handleReportIssue}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Issue Type
                  </label>
                  <select
                    value={issueFormData.issueType}
                    onChange={(e) =>
                      setIssueFormData({
                        ...issueFormData,
                        issueType: e.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select issue type</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Body Damage">Body Damage</option>
                    <option value="Accident">Accident</option>
                    <option value="Recall">Recall</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={issueFormData.description}
                    onChange={(e) =>
                      setIssueFormData({
                        ...issueFormData,
                        description: e.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Evidence URI (optional)
                  </label>
                  <input
                    type="text"
                    value={issueFormData.evidenceURI}
                    onChange={(e) =>
                      setIssueFormData({
                        ...issueFormData,
                        evidenceURI: e.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="IPFS URI or other link to evidence"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={issueLoading}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors disabled:bg-yellow-400"
                >
                  {issueLoading ? (
                    <>
                      <Loader size={16} className="inline animate-spin mr-2" />
                      Reporting...
                    </>
                  ) : (
                    "Report Issue"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
