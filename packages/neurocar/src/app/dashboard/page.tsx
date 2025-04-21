"use client";

import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import Image from "next/image";
import {
  Car,
  Plus,
  Wrench,
  AlertTriangle,
  Shield,
  FileText,
  Loader,
  QrCode,
  // ChevronLeft,
  // ChevronRight,
} from "lucide-react";
import { CarWithId } from "@/types";
import MaintenanceRecordsList from "./_components/MaintenanceRecordsList";
import IssueReportsList from "./_components/IssueReportsList";
import InsurancePools from "./_components/InsurancePools";
import InsuranceClaims from "./_components/InsuranceClaims";
import { useUserCars } from "@/blockchain/hooks/useUserCars";
import { useCarNFTData } from "@/blockchain/hooks/useCarNFT";
// import { useCarInsuranceData } from "@/blockchain/hooks/useCarInsurance";
import IPFSUpload from "./_components/IPFSUpload";
import QRCode from "react-qr-code";

export default function Dashboard() {
  const { address } = useAccount();
  const [selectedCar, setSelectedCar] = useState<CarWithId | null>(null);
  const [activeTab, setActiveTab] = useState("maintenance");
  const [mintLoading, setMintLoading] = useState(false);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [issueLoading, setIssueLoading] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  // Form states
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

  // Hooks for data fetching
  const {
    cars: userCars,
    loading: carsLoading,
    error: carsError,
  } = useUserCars(address);
  const { mintCar, addMaintenanceRecord, reportIssue } = useCarNFTData();

  // Set first car as selected on load
  useEffect(() => {
    if (userCars && userCars.length > 0 && !selectedCar) {
      setSelectedCar(userCars[0]);
    }
  }, [userCars, selectedCar]);

  // Handle car minting
  const handleMintCar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address) {
      alert("Please connect your wallet before minting a vehicle NFT");
      return;
    }

    if (
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
      setShowMintModal(false);
      setMintFormData({
        make: "",
        model: "",
        year: "",
        vin: "",
        initialMileage: "",
        registrationNumber: "",
        metadataURI: "",
      });
    } catch (error) {
      console.error("Minting error:", error);
      alert("Failed to mint vehicle NFT");
    } finally {
      setMintLoading(false);
    }
  };

  // Handle maintenance record addition
  const handleAddMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !selectedCar ||
      !maintenanceFormData.description ||
      !maintenanceFormData.mileage
    ) {
      alert("Please fill all required fields");
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
      setShowMaintenanceModal(false);
      setMaintenanceFormData({
        description: "",
        serviceProvider: "",
        mileage: "",
        documentURI: "",
      });
    } catch (error) {
      console.error("Maintenance error:", error);
      alert("Failed to add maintenance record");
    } finally {
      setMaintenanceLoading(false);
    }
  };

  // Handle issue reporting
  const handleReportIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !selectedCar ||
      !issueFormData.issueType ||
      !issueFormData.description
    ) {
      alert("Please fill all required fields");
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
      setShowIssueModal(false);
      setIssueFormData({
        issueType: "",
        description: "",
        evidenceURI: "",
      });
    } catch (error) {
      console.error("Issue reporting error:", error);
      alert("Failed to report issue");
    } finally {
      setIssueLoading(false);
    }
  };

  // Generate vehicle data URL for QR code
  const generateVehicleDataURL = (car: CarWithId) => {
    // Create a data object with key vehicle information
    const vehicleData = {
      id: car.id.toString(), // Convert BigInt to string
      make: car.make,
      model: car.model,
      year: car.year,
      vin: car.vin,
      mileage: car.mileage,
      registrationNumber: car.registrationNumber || "N/A",
      owner: address,
      tokenId: car.id.toString(), // Convert BigInt to string
      issueDate: new Date().toISOString(),
      imageURI: car.metadataURI || "" // Include the car image URI
    };

    // Custom BigInt serialization
    const stringifiedData = JSON.stringify(vehicleData, (key, value) => 
      typeof value === 'bigint' ? value.toString() : value
    );

    // Convert to a URL-safe string that can be shared
    return `${window.location.origin}/vehicle/${
      car.id
    }?data=${encodeURIComponent(stringifiedData)}`;
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

  console.log(selectedCar);

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
        {/* Sidebar - Vehicle List */}
        <div className="w-full md:w-1/4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                My Vehicles
              </h2>
              <button
                onClick={() =>
                  address
                    ? setShowMintModal(true)
                    : alert("Please connect your wallet first")
                }
                className={`p-2 ${
                  address ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400"
                } text-white rounded-full transition-colors`}
                aria-label="Add new vehicle"
                disabled={!address}
              >
                <Plus size={16} />
              </button>
            </div>

            {userCars && userCars.length > 0 ? (
              <div className="space-y-2 max-h-[calc(100vh-180px)] overflow-y-auto">
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
                      <div className="truncate">
                        <h3 className="font-medium text-gray-900 truncate">
                          {car.make} {car.model}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">
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
                  onClick={() =>
                    address
                      ? setShowMintModal(true)
                      : alert("Please connect your wallet first")
                  }
                  className={`mt-4 px-4 py-2 ${
                    address ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400"
                  } text-white rounded-md transition-colors`}
                  disabled={!address}
                >
                  {address
                    ? "Add Your First Vehicle"
                    : "Connect Wallet to Add Vehicle"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="w-full md:w-3/4">
          {selectedCar ? (
            <>
              {/* Vehicle Header */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                  <div className="flex items-center gap-4">
                    {selectedCar.metadataURI ? (
                      <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100">
                        <Image
                          src={selectedCar.metadataURI.replace(
                            "ipfs://",
                            "https://ipfs.io/ipfs/"
                          )}
                          alt={`${selectedCar.make} ${selectedCar.model}`}
                          className="w-full h-full object-cover"
                          width={64}
                          height={64}
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-md bg-gray-100 flex items-center justify-center">
                        <Car size={24} className="text-gray-400" />
                      </div>
                    )}
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">
                        {selectedCar.make} {selectedCar.model}
                      </h1>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                        <p className="text-gray-500 text-sm">
                          {selectedCar.year}
                        </p>
                        <p className="text-gray-500 text-sm">
                          VIN: {selectedCar.vin}
                        </p>
                        <p className="text-gray-500 text-sm">
                          Mileage: {selectedCar.mileage.toLocaleString()} miles
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-end">
                    <button
                      onClick={() => setShowQRModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <QrCode size={16} className="mr-2" />
                      Generate QR Code
                    </button>
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

              {/* Navigation Tabs */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab("maintenance")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center whitespace-nowrap ${
                      activeTab === "maintenance"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Wrench size={16} className="mr-2" />
                    Maintenance History
                  </button>
                  <button
                    onClick={() => setActiveTab("issues")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center whitespace-nowrap ${
                      activeTab === "issues"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <AlertTriangle size={16} className="mr-2" />
                    Issue Reports
                  </button>
                  <button
                    onClick={() => setActiveTab("insurance")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center whitespace-nowrap ${
                      activeTab === "insurance"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Shield size={16} className="mr-2" />
                    Insurance
                  </button>
                  <button
                    onClick={() => setActiveTab("claims")}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center whitespace-nowrap ${
                      activeTab === "claims"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <FileText size={16} className="mr-2" />
                    Claims History
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {activeTab === "maintenance" && (
                  <MaintenanceRecordsList tokenId={selectedCar.id} />
                )}
                {activeTab === "issues" && (
                  <IssueReportsList tokenId={selectedCar.id} />
                )}
                {activeTab === "insurance" && (
                  <InsurancePools
                    cars={userCars || []}
                    selectedCar={selectedCar}
                    loading={false}
                  />
                )}
                {activeTab === "claims" && (
                  <InsuranceClaims tokenId={selectedCar.id} />
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
                onClick={() =>
                  address
                    ? setShowMintModal(true)
                    : alert("Please connect your wallet first")
                }
                className={`p-2 ${
                  address ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400"
                } text-white rounded-full transition-colors px-4`}
                aria-label="Add new vehicle"
                disabled={!address}
              >
                Add New Vehicle
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mint Vehicle Modal */}
      {showMintModal && (
        <div className="fixed inset-0 bg-slate-400 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white bg-opacity-90 backdrop-filter backdrop-blur-md rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col shadow-xl">
            <div className="p-6 border-b border-gray-200 bg-white bg-opacity-70">
              <h2 className="text-xl font-semibold text-gray-800">
                Add New Vehicle
              </h2>
            </div>

            {/* Scrollable content area */}
            <div className="p-6 overflow-y-auto flex-grow">
              <form onSubmit={handleMintCar}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Make <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={mintFormData.make}
                      onChange={(e) =>
                        setMintFormData({
                          ...mintFormData,
                          make: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white bg-opacity-80"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Model <span className="text-red-500">*</span>
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
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white bg-opacity-80"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Year <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={mintFormData.year}
                      onChange={(e) =>
                        setMintFormData({
                          ...mintFormData,
                          year: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white bg-opacity-80"
                      required
                      min="1900"
                      max={new Date().getFullYear()}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      VIN <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={mintFormData.vin}
                      onChange={(e) =>
                        setMintFormData({
                          ...mintFormData,
                          vin: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white bg-opacity-80"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white bg-opacity-80"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white bg-opacity-80"
                      min="0"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vehicle Image <span className="text-red-500">*</span>
                  </label>
                  <IPFSUpload
                    onUploadComplete={(url) => {
                      setMintFormData({ ...mintFormData, metadataURI: url });
                    }}
                  />
                  {mintFormData.metadataURI && (
                    <p className="mt-2 text-sm text-gray-500 truncate">
                      Uploaded: {mintFormData.metadataURI}
                    </p>
                  )}
                </div>
              </form>
            </div>

            {/* Fixed footer with buttons */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 bg-opacity-70 backdrop-filter backdrop-blur-sm rounded-b-lg">
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowMintModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleMintCar}
                  disabled={mintLoading || !mintFormData.metadataURI}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  {mintLoading ? (
                    <>
                      <Loader size={16} className="inline animate-spin mr-2" />
                      Minting...
                    </>
                  ) : (
                    "Mint Vehicle NFT"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Modal */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 bg-slate-400 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white bg-opacity-90 backdrop-filter backdrop-blur-md rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col shadow-xl">
            <div className="p-6 border-b border-gray-200 bg-white bg-opacity-70">
              <h2 className="text-xl font-semibold text-gray-800">
                Add Maintenance Record
              </h2>
            </div>

            {/* Scrollable content area */}
            <div className="p-6 overflow-y-auto flex-grow">
              <form id="maintenanceForm" onSubmit={handleAddMaintenance}>
                <div className="space-y-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={maintenanceFormData.description}
                      onChange={(e) =>
                        setMaintenanceFormData({
                          ...maintenanceFormData,
                          description: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white bg-opacity-80"
                      required
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
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
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white bg-opacity-80"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mileage <span className="text-red-500">*</span>
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
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white bg-opacity-80"
                        required
                        min="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Document
                    </label>
                    <IPFSUpload
                      onUploadComplete={(url) => {
                        setMaintenanceFormData({
                          ...maintenanceFormData,
                          documentURI: url,
                        });
                      }}
                    />
                    {maintenanceFormData.documentURI && (
                      <p className="mt-2 text-sm text-gray-500 truncate">
                        Uploaded: {maintenanceFormData.documentURI}
                      </p>
                    )}
                  </div>
                </div>
              </form>
            </div>

            {/* Fixed footer with buttons */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 bg-opacity-70 backdrop-filter backdrop-blur-sm rounded-b-lg">
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowMaintenanceModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="maintenanceForm"
                  disabled={maintenanceLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-green-400 disabled:cursor-not-allowed"
                >
                  {maintenanceLoading ? (
                    <>
                      <Loader size={16} className="inline animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Add Maintenance Record"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Issue Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-slate-400 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white bg-opacity-90 backdrop-filter backdrop-blur-md rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col shadow-xl">
            <div className="p-6 border-b border-gray-200 bg-white bg-opacity-70">
              <h2 className="text-xl font-semibold text-gray-800">
                Report Vehicle Issue
              </h2>
            </div>

            {/* Scrollable content area */}
            <div className="p-6 overflow-y-auto flex-grow">
              <form id="issueForm" onSubmit={handleReportIssue}>
                <div className="space-y-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Issue Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={issueFormData.issueType}
                      onChange={(e) =>
                        setIssueFormData({
                          ...issueFormData,
                          issueType: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white bg-opacity-80"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={issueFormData.description}
                      onChange={(e) =>
                        setIssueFormData({
                          ...issueFormData,
                          description: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white bg-opacity-80"
                      required
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Evidence (Photos/Documents)
                    </label>
                    <IPFSUpload
                      onUploadComplete={(url) => {
                        setIssueFormData({
                          ...issueFormData,
                          evidenceURI: url,
                        });
                      }}
                    />
                    {issueFormData.evidenceURI && (
                      <p className="mt-2 text-sm text-gray-500 truncate">
                        Uploaded: {issueFormData.evidenceURI}
                      </p>
                    )}
                  </div>
                </div>
              </form>
            </div>

            {/* Fixed footer with buttons */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 bg-opacity-70 backdrop-filter backdrop-blur-sm rounded-b-lg">
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="issueForm"
                  disabled={issueLoading}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors disabled:bg-yellow-400 disabled:cursor-not-allowed"
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
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedCar && (
        <div className="fixed inset-0 bg-slate-400 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white bg-opacity-90 backdrop-filter backdrop-blur-md rounded-lg max-w-md w-full max-h-[90vh] flex flex-col shadow-xl">
            <div className="p-6 border-b border-gray-200 bg-white bg-opacity-70">
              <h2 className="text-xl font-semibold text-gray-800">
                Vehicle QR Code
              </h2>
            </div>

            {/* QR Code display area */}
            <div className="p-6 overflow-y-auto flex-grow flex flex-col items-center">
              <div className="mb-4 text-center">
                <h3 className="font-medium text-lg text-gray-800">
                  {selectedCar.make} {selectedCar.model} ({selectedCar.year})
                </h3>
                <p className="text-gray-500">VIN: {selectedCar.vin}</p>
              </div>

              <div className="p-4 bg-white rounded-lg shadow-md mb-4">
                <QRCode
                  id="vehicle-qr-code"
                  value={generateVehicleDataURL(selectedCar)}
                  size={200}
                  level="H"
                />
              </div>

              <p className="text-sm text-gray-600 text-center">
                Scan this QR code to access vehicle information
              </p>
            </div>

            {/* Footer with buttons */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 bg-opacity-70 backdrop-filter backdrop-blur-sm rounded-b-lg">
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowQRModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard
                      .writeText(generateVehicleDataURL(selectedCar))
                      .then(() => alert("Vehicle info URL copied to clipboard"))
                      .catch((err) => console.error("Failed to copy URL", err));
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
