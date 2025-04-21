"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  Car,
  ArrowLeft,
  Wrench,
  AlertTriangle,
  Shield,
  User,
  Calendar,
  CircleX,
  Printer,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import QRCode from "react-qr-code";
import { useAccount } from "wagmi";

// Define the vehicle data type that will be parsed from the URL
interface VehicleData {
  id: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  mileage: number;
  registrationNumber: string;
  owner: string;
  tokenId: string;
  issueDate: string;
  imageURI?: string; // Add image URI field
}

export default function VehiclePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { address } = useAccount();
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const qrCodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Try to parse the vehicle data from the URL parameters
    try {
      const data = searchParams.get("data");
      if (data) {
        const decodedData = JSON.parse(decodeURIComponent(data)) as VehicleData;
        setVehicleData(decodedData);

        // Check if the current user is the owner of the vehicle
        if (address && decodedData.owner === address) {
          setIsOwner(true);
        }
      } else {
        // If no data parameter, we should fetch the data using the ID
        // This would be implemented if we store the vehicle data in a database
        setError("Vehicle data not found. Try scanning the QR code again.");
      }
    } catch (err) {
      console.error("Error parsing vehicle data:", err);
      setError("Failed to load vehicle information. Invalid QR code data.");
    }
  }, [searchParams, address, params.id]);

  // Function to print the QR code
  const handlePrintQRCode = () => {
    if (!qrCodeRef.current) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow pop-ups to print the QR code");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${vehicleData?.make} ${
      vehicleData?.model
    } - Vehicle QR Code</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
          .qr-container { margin: 20px auto; max-width: 400px; }
          h1 { font-size: 18px; margin-bottom: 5px; color: #333; }
          p { font-size: 14px; color: #666; margin-bottom: 20px; }
          .vehicle-image { max-width: 200px; height: auto; margin: 10px auto; display: block; }
          .qr-code { margin: 15px auto; display: block; }
          .info { font-size: 12px; margin-top: 30px; color: #999; }
        </style>
      </head>
      <body>
        <div class="qr-container">
          <h1>${vehicleData?.make} ${vehicleData?.model} (${
      vehicleData?.year
    })</h1>
          <p>VIN: ${vehicleData?.vin}</p>
          ${
            vehicleData?.imageURI
              ? `<img src="${vehicleData.imageURI.replace(
                  "ipfs://",
                  "https://ipfs.io/ipfs/"
                )}" class="vehicle-image" alt="Vehicle image" />`
              : ""
          }
          ${qrCodeRef.current.innerHTML}
          <p class="info">Scan this QR code to verify vehicle information on CarLogix</p>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        <script>
          window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // If there's an error loading the data
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm border border-red-200 p-6">
          <div className="text-center mb-6">
            <CircleX size={48} className="mx-auto text-red-500 mb-2" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600">{error}</p>
          </div>
          <div className="flex justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <ArrowLeft size={16} className="mr-2" />
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (!vehicleData) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="rounded-full bg-slate-200 h-16 w-16 mb-4"></div>
          <div className="h-4 bg-slate-200 rounded w-[250px] mb-3"></div>
          <div className="h-4 bg-slate-200 rounded w-[200px]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back to Dashboard
        </Link>
      </div>

      {/* Vehicle details card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-md flex items-center justify-center bg-blue-100">
                <Car size={32} className="text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {vehicleData.make} {vehicleData.model}
                </h1>
                <p className="text-gray-600">{vehicleData.year}</p>
              </div>
            </div>
            <div className="flex flex-col text-sm text-gray-500">
              <div className="flex items-center mb-1">
                <Calendar size={16} className="mr-2" />
                <span>
                  Valid as of:{" "}
                  {new Date(vehicleData.issueDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center">
                <User size={16} className="mr-2" />
                <span>
                  {isOwner
                    ? "You are the registered owner"
                    : "Verified Vehicle Record"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Vehicle Information
              </h2>

              {/* Display vehicle image if available */}
              {vehicleData.imageURI && (
                <div className="mb-4 rounded-md overflow-hidden">
                  <Image
                    src={vehicleData.imageURI.replace(
                      "ipfs://",
                      "https://ipfs.io/ipfs/"
                    )}
                    alt={`${vehicleData.make} ${vehicleData.model}`}
                    width={300}
                    height={200}
                    className="w-full object-cover rounded-md"
                  />
                </div>
              )}

              <dl className="grid grid-cols-[120px_1fr] gap-2">
                <dt className="text-sm font-medium text-gray-500">VIN:</dt>
                <dd className="text-sm text-gray-900">{vehicleData.vin}</dd>

                <dt className="text-sm font-medium text-gray-500">Mileage:</dt>
                <dd className="text-sm text-gray-900">
                  {vehicleData.mileage.toLocaleString()} miles
                </dd>

                <dt className="text-sm font-medium text-gray-500">
                  Registration:
                </dt>
                <dd className="text-sm text-gray-900">
                  {vehicleData.registrationNumber}
                </dd>

                <dt className="text-sm font-medium text-gray-500">Token ID:</dt>
                <dd className="text-sm text-gray-900">{vehicleData.tokenId}</dd>
              </dl>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Ownership & Authentication
              </h2>
              <dl className="grid grid-cols-[120px_1fr] gap-2">
                <dt className="text-sm font-medium text-gray-500">Owner:</dt>
                <dd className="text-sm text-gray-900 break-all">
                  {vehicleData.owner}
                </dd>

                <dt className="text-sm font-medium text-gray-500">Status:</dt>
                <dd className="text-sm text-gray-900">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Verified
                  </span>
                </dd>
              </dl>
            </div>
          </div>

          {/* Information for viewers */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="bg-blue-50 p-4 rounded-md">
              <h3 className="text-md font-medium text-blue-800 mb-2">
                What can I do with this information?
              </h3>
              <p className="text-sm text-blue-700 mb-3">
                This QR code provides verified information about this vehicle
                from the CarLogix blockchain system. The information shown here
                has been cryptographically verified and cannot be tampered with.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="p-3 bg-white rounded-md shadow-sm">
                  <div className="flex items-center mb-2">
                    <Wrench size={18} className="text-blue-600 mr-2" />
                    <h4 className="font-medium text-gray-900">Maintenance</h4>
                  </div>
                  <p className="text-xs text-gray-600">
                    Mechanics can verify vehicle history before performing
                    maintenance.
                  </p>
                </div>
                <div className="p-3 bg-white rounded-md shadow-sm">
                  <div className="flex items-center mb-2">
                    <AlertTriangle size={18} className="text-amber-600 mr-2" />
                    <h4 className="font-medium text-gray-900">History Check</h4>
                  </div>
                  <p className="text-xs text-gray-600">
                    Potential buyers can scan to verify vehicle history and
                    ownership.
                  </p>
                </div>
                <div className="p-3 bg-white rounded-md shadow-sm">
                  <div className="flex items-center mb-2">
                    <Shield size={18} className="text-green-600 mr-2" />
                    <h4 className="font-medium text-gray-900">Insurance</h4>
                  </div>
                  <p className="text-xs text-gray-600">
                    Insurance providers can verify vehicle details for coverage.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional information link for owners */}
      {isOwner && (
        <div className="bg-white rounded-lg shadow-sm border border-green-200 p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <User size={24} className="text-green-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                You are the registered owner of this vehicle
              </h3>
              <div className="mt-2">
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-green-600 hover:text-green-500"
                >
                  Manage your vehicle in the dashboard →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code and Print Button */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-800">
              Vehicle QR Code
            </h3>
            <p className="text-xs text-gray-600">
              Scan this QR code to verify vehicle information.
            </p>
          </div>
          <button
            onClick={handlePrintQRCode}
            className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Printer size={16} className="mr-2" />
            Print QR Code
          </button>
        </div>
        <div ref={qrCodeRef} className="mt-4 p-4 bg-white flex justify-center">
          {/* Actual QR Code */}
          <QRCode
            value={window.location.href}
            size={180}
            level="H"
            className="mx-auto"
          />
        </div>
      </div>
    </div>
  );
}
