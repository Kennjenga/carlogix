// src/app/mymech/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAccount } from "wagmi";
import {
  Wrench,
  Loader,
  AlertTriangle,
  Car,
  ArrowLeft,
  Database,
} from "lucide-react";
import { useUserCars } from "@/blockchain/hooks/useUserCars";
import { CarWithId } from "@/types";
import DiagnosisForm from "./_components/DiagnosisForm";
import DiagnosisResult from "./_components/DiagnosisResult";
import VehicleSelector from "./_components/VehicleSelector";

export type Diagnosis = {
  diagnosis: string;
  likelyIssue: string;
  severity: "low" | "medium" | "high";
  urgency: boolean;
  nextSteps: string[];
  estimatedCost: string;
  relevantSources?: number;
};

export default function DigitalMechanicPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { address } = useAccount();

  // Get car ID from URL if available
  const carIdFromUrl = searchParams.get("carId");

  // State for selected car and diagnosis
  const [selectedCar, setSelectedCar] = useState<CarWithId | null>(null);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [userQuery, setUserQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useRag, setUseRag] = useState(true);

  // Fetch user's cars
  const {
    cars: userCars,
    loading: carsLoading,
    error: carsError,
  } = useUserCars(address);

  // Set selected car from URL parameter or first car
  useEffect(() => {
    if (userCars && userCars.length > 0) {
      if (carIdFromUrl) {
        const carFromUrl = userCars.find((car) => car.id === carIdFromUrl);
        if (carFromUrl) {
          setSelectedCar(carFromUrl);
          return;
        }
      }

      // If no car ID in URL or car not found, select first car
      if (!selectedCar) {
        setSelectedCar(userCars[0]);
      }
    }
  }, [userCars, carIdFromUrl, selectedCar]);

  // Handle car selection
  const handleSelectCar = (car: CarWithId) => {
    setSelectedCar(car);
    setDiagnosis(null); // Reset diagnosis when car changes

    // Update URL with selected car ID
    const params = new URLSearchParams(searchParams.toString());
    params.set("carId", car.id);
    router.push(`/mymech?${params.toString()}`);
  };

  // Handle diagnosis submission
  const handleDiagnose = async () => {
    if (!selectedCar || !userQuery.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Convert any potentially problematic values like BigInt to safe formats
      const carDetails = {
        make: selectedCar.make,
        model: selectedCar.model,
        year: Number(selectedCar.year),
        mileage: Number(selectedCar.mileage),
        vin: selectedCar.vin,
      };

      const response = await fetch("/api/diagnose", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          carDetails,
          userQuery: userQuery.trim(),
          useRag: useRag,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get diagnosis");
      }

      const data = await response.json();
      setDiagnosis(data);
    } catch (err) {
      console.error("Error getting diagnosis:", err);
      setError("Failed to analyze your issue. Please try again.");
    } finally {
      setLoading(false);
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

  // No cars state
  if (!userCars || userCars.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="mr-4 p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Digital Mechanic</h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <Car size={48} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            No Vehicles Found
          </h2>
          <p className="text-gray-500 mb-6">
            You need to add a vehicle to your garage before using the Digital
            Mechanic.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => router.push("/dashboard")}
          className="mr-4 p-2 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center">
          <Wrench size={24} className="text-blue-600 mr-2" />
          <h1 className="text-2xl font-bold text-gray-900">Digital Mechanic</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar with car selection */}
        <div className="md:col-span-1">
          <VehicleSelector
            cars={userCars}
            selectedCar={selectedCar}
            onSelectCar={handleSelectCar}
          />

          {/* RAG toggle */}
          <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Database size={20} className="text-blue-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">
                  Knowledge Base
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useRag}
                  onChange={() => setUseRag(!useRag)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-700">
                  {useRag ? "Enabled" : "Disabled"}
                </span>
              </label>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {useRag
                ? "Using our comprehensive repair database for enhanced diagnostics"
                : "Basic diagnostics without repair database"}
            </p>
          </div>
        </div>

        {/* Main content area */}
        <div className="md:col-span-2">
          {selectedCar ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {/* Car details header */}
              <div className="flex items-center mb-6 pb-4 border-b border-gray-100">
                <Car size={24} className="text-blue-600 mr-3" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedCar.make} {selectedCar.model}
                  </h2>
                  <p className="text-gray-500">
                    {selectedCar.year} • VIN: {selectedCar.vin.substring(0, 8)}
                    ...
                  </p>
                </div>
              </div>

              {!diagnosis ? (
                <DiagnosisForm
                  userQuery={userQuery}
                  setUserQuery={setUserQuery}
                  onSubmit={handleDiagnose}
                  loading={loading}
                  error={error}
                />
              ) : (
                <DiagnosisResult
                  diagnosis={diagnosis}
                  onNewDiagnosis={() => setDiagnosis(null)}
                />
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <AlertTriangle
                size={48}
                className="mx-auto text-yellow-500 mb-4"
              />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                No Vehicle Selected
              </h2>
              <p className="text-gray-500">
                Please select a vehicle from the list to get started.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
