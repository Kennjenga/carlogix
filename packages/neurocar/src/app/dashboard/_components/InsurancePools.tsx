"use client";

// app/dashboard/_components/InsurancePools.tsx
import React, { useState } from "react";
import { useCarInsuranceData } from "@/blockchain/hooks/useCarInsurance";
import { useMembershipDetails } from "@/blockchain/hooks/useContractReads";
import { useAccount } from "wagmi";
import {
  Shield,
  Info,
  Plus,
  ChevronRight,
  Loader,
  AlertCircle,
} from "lucide-react";
import { CarWithId } from "@/types";

interface InsurancePoolsProps {
  pools: {
    id: string;
    name: string;
    description: string;
    minContribution: bigint;
    maxCoverage: bigint;
    memberCount?: number;
    totalFunds?: bigint;
  }[];
  cars: CarWithId[];
  selectedCar: CarWithId | null;
  loading: boolean;
}

const InsurancePools: React.FC<InsurancePoolsProps> = ({
  pools,
  cars,
  selectedCar,
  loading: parentLoading,
}) => {
  const { address } = useAccount();
  const carInsurance = useCarInsuranceData(296);

  const [showJoinForm, setShowJoinForm] = useState<boolean>(false);
  const [selectedPool, setSelectedPool] = useState<string | null>(null);
  const [contributionAmount, setContributionAmount] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedCarForPool, setSelectedCarForPool] = useState<string>(
    selectedCar ? selectedCar.id : ""
  );

  // Get membership details if a pool and user are selected
  const { isLoading: membershipLoading } = useMembershipDetails(
    selectedPool ? BigInt(selectedPool) : undefined,
    address,
    296
  );

  // Handle joining a pool
  const handleJoinPool = async () => {
    if (!selectedPool || !selectedCarForPool || !contributionAmount) return;

    try {
      setLoading(true);

      await carInsurance.joinPool(
        BigInt(selectedPool),
        BigInt(selectedCarForPool),
        // Convert ETH to Wei (or whatever the native token is)
        BigInt(parseFloat(contributionAmount) * 10 ** 18)
      );

      setShowJoinForm(false);
      setSelectedPool(null);
      setContributionAmount("");
    } catch (error) {
      console.error("Error joining pool:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle leaving a pool
  const handleLeavePool = async (poolId: string) => {
    try {
      setLoading(true);

      await carInsurance.leavePool(BigInt(poolId));
    } catch (error) {
      console.error("Error leaving pool:", error);
    } finally {
      setLoading(false);
    }
  };

  // Format a bigint value as ETH
  const formatEth = (value: bigint) => {
    return (Number(value) / 10 ** 18).toFixed(4);
  };

  if (parentLoading || membershipLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader size={24} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (pools.length === 0) {
    return (
      <div className="rounded-md bg-yellow-50 p-4 mb-4">
        <div className="flex">
          <AlertCircle size={16} className="h-5 w-5 text-yellow-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              No Insurance Pools Found
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                You are not a member of any insurance pools yet. Check back
                later or join an existing pool.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pools list */}
      <div className="border border-gray-200 rounded-md overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {pools.map((pool) => (
            <li key={pool.id} className="p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center">
                    <Shield size={16} className="text-blue-500 mr-2" />
                    <h4 className="text-lg font-medium text-gray-900">
                      {pool.name}
                    </h4>
                  </div>
                  <p className="mt-1 text-sm text-gray-500 ml-6">
                    {pool.description}
                  </p>
                  <div className="mt-2 ml-6 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div className="text-gray-500">
                      <span className="font-medium">Min Contribution:</span>{" "}
                      {formatEth(pool.minContribution)} ETH
                    </div>
                    <div className="text-gray-500">
                      <span className="font-medium">Max Coverage:</span>{" "}
                      {formatEth(pool.maxCoverage)} ETH
                    </div>
                    {pool.memberCount !== undefined && (
                      <div className="text-gray-500">
                        <span className="font-medium">Members:</span>{" "}
                        {pool.memberCount}
                      </div>
                    )}
                    {pool.totalFunds !== undefined && (
                      <div className="text-gray-500">
                        <span className="font-medium">Total Balance:</span>{" "}
                        {formatEth(pool.totalFunds)} ETH
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPool(pool.id);
                      setShowJoinForm(true);
                    }}
                    className="inline-flex items-center px-3 py-1.5 border border-blue-600 shadow-sm text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <Plus size={14} className="mr-1" />
                    Join
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLeavePool(pool.id)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Leave
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Join Pool Form */}
      {showJoinForm && selectedPool && (
        <div className="border border-gray-200 rounded-lg shadow-sm bg-gray-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-100">
            <h3 className="text-lg font-medium text-gray-900">
              Join Insurance Pool
            </h3>
          </div>
          <div className="px-4 py-4">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="carSelect"
                  className="block text-sm font-medium text-gray-700"
                >
                  Select Car
                </label>
                <select
                  id="carSelect"
                  value={selectedCarForPool}
                  onChange={(e) => setSelectedCarForPool(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select a car</option>
                  {cars.map((car) => (
                    <option key={car.id} value={car.id}>
                      {car.make} {car.model} ({car.year.toString()}) - {car.vin}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="contribution"
                  className="block text-sm font-medium text-gray-700"
                >
                  Contribution Amount (ETH)
                </label>
                <input
                  id="contribution"
                  type="number"
                  min="0"
                  step="0.01"
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Minimum contribution:{" "}
                  {formatEth(
                    pools.find((p) => p.id === selectedPool)?.minContribution ||
                      BigInt(0)
                  )}{" "}
                  ETH
                </p>
              </div>

              <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                <div className="flex items-start">
                  <Info size={16} className="text-blue-500 mr-2 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">Important Information</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>
                        Your contribution will be locked in the pool until you
                        leave
                      </li>
                      <li>
                        Only one car can be registered per pool membership
                      </li>
                      <li>
                        Coverage is limited to the pool&apos;s max coverage
                        amount
                      </li>
                      <li>Claims will be assessed by approved assessors</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="px-4 py-3 bg-gray-100 text-right flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                setShowJoinForm(false);
                setSelectedPool(null);
              }}
              className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleJoinPool}
              disabled={loading || !selectedCarForPool || !contributionAmount}
              className={`inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                loading || !selectedCarForPool || !contributionAmount
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
                  <ChevronRight size={16} className="mr-2" />
                  Join Pool
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsurancePools;
