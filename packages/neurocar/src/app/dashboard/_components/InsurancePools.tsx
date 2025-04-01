"use client";

// app/dashboard/_components/InsurancePools.tsx
import React, { useState, useEffect } from "react";
import { useCarInsuranceData } from "@/blockchain/hooks/useCarInsurance";
import {
  useMemberPools,
  // usePoolDetails,
  fetchAllPools,
  // useDefaultAdminRole,
} from "@/blockchain/hooks/useContractReads";
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
import { Address, createPublicClient, http } from "viem";
import { hederaTestnet } from "viem/chains";
import { carinsurance_abi, carinsurance_address } from "@/blockchain/abi/neuro";

interface InsurancePoolsProps {
  cars: CarWithId[];
  selectedCar: CarWithId | null;
  loading: boolean;
}

interface PoolData {
  id: string;
  name: string;
  description: string;
  minContribution: bigint;
  maxCoverage: bigint;
  memberCount?: number;
  totalFunds?: bigint;
}

// Create a client to interact directly with the blockchain
const publicClient = createPublicClient({
  chain: {
    ...hederaTestnet,
    id: 296,
    name: "Hedera Testnet",
    rpcUrls: {
      default: {
        http: ["https://testnet.hashio.io/api"],
      },
      public: {
        http: ["https://testnet.hashio.io/api"],
      },
    },
  },
  transport: http("https://testnet.hashio.io/api"),
});

const InsurancePools: React.FC<InsurancePoolsProps> = ({
  cars,
  selectedCar,
  loading: parentLoading,
}) => {
  const { address } = useAccount();
  const carInsurance = useCarInsuranceData(296);

  // State for pools data
  const [pools, setPools] = useState<PoolData[]>([]);
  const [fetchingPools, setFetchingPools] = useState<boolean>(true);
  const [poolsError, setPoolsError] = useState<Error | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // UI states
  const [showJoinForm, setShowJoinForm] = useState<boolean>(false);
  const [showCreatePoolForm, setShowCreatePoolForm] = useState<boolean>(false);
  const [selectedPool, setSelectedPool] = useState<string | null>(null);
  const [contributionAmount, setContributionAmount] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedCarForPool, setSelectedCarForPool] = useState<string>(
    selectedCar ? selectedCar.id : ""
  );

  // Create pool form state
  const [poolFormData, setPoolFormData] = useState({
    name: "",
    description: "",
    minContribution: "0.05",
    maxCoverage: "1",
  });

  // Get member pools data
  const { data: memberPoolIds, isLoading: loadingMemberPools } = useMemberPools(
    address,
    296
  ) as {
    data: bigint[] | undefined;
    isLoading: boolean;
  };

  // Effect to set the selected car for pool when selectedCar changes
  useEffect(() => {
    if (selectedCar) {
      setSelectedCarForPool(selectedCar.id);
    }
  }, [selectedCar]);

  // Fetch all available insurance pools
  useEffect(() => {
    const fetchAvailablePools = async () => {
      if (!address) {
        setPools([]);
        setFetchingPools(false);
        return;
      }

      try {
        setFetchingPools(true);
        console.log("Fetching pools for address:", address);

        // Use the new fetchAllPools function to get all pools
        const allPools = await fetchAllPools();
        console.log("All available pools:", allPools);

        // If we have member pool IDs, we can mark which pools the user is a member of
        if (memberPoolIds && memberPoolIds.length > 0) {
          const memberPoolIdSet = new Set(
            memberPoolIds.map((id) => id.toString())
          );
          allPools.forEach((pool) => {
            if (pool) {
              // Add the isMember property to the pool object
              (pool as typeof pool & { isMember: boolean }).isMember =
                memberPoolIdSet.has(pool.id);
            }
          });
        }
        // Filter out null values before setting pools
        setPools(
          allPools.filter(
            (pool): pool is typeof pool & { isMember?: boolean } =>
              pool !== null
          )
        );
      } catch (error) {
        console.error("Error fetching pools:", error);
        setPoolsError(
          error instanceof Error ? error : new Error("Failed to fetch pools")
        );
      } finally {
        setFetchingPools(false);
      }
    };

    fetchAvailablePools();
  }, [address, memberPoolIds]);

  // Check if the current user is an admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!address) {
        setIsAdmin(false);
        return;
      }

      try {
        // Get the DEFAULT_ADMIN_ROLE from the contract
        const defaultAdminRoleResult = await publicClient.readContract({
          address: carinsurance_address as Address,
          abi: carinsurance_abi,
          functionName: "DEFAULT_ADMIN_ROLE",
        });

        const defaultAdminRole = defaultAdminRoleResult as string;
        console.log("DEFAULT_ADMIN_ROLE:", defaultAdminRole);

        // Check if the user has the admin role
        const adminStatus = await publicClient.readContract({
          address: carinsurance_address as Address,
          abi: carinsurance_abi,
          functionName: "hasRole",
          args: [defaultAdminRole, address],
        });

        setIsAdmin(!!adminStatus);
        console.log("User is admin:", !!adminStatus);
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [address]);

  // Handle pool creation event
  useEffect(() => {
    if (carInsurance.lastPoolCreatedEvent) {
      const eventData = carInsurance.lastPoolCreatedEvent;

      // Check if this pool already exists in our list
      const poolExists = pools.some(
        (p) => p.id === eventData.poolId.toString()
      );

      if (!poolExists) {
        // Add the new pool to the list
        const fetchPoolDetails = async () => {
          try {
            // Try to get the full pool details from the contract
            const poolDetails = await publicClient.readContract({
              address: carinsurance_address as Address,
              abi: carinsurance_abi,
              functionName: "getPoolDetails",
              args: [eventData.poolId],
            });

            if (poolDetails) {
              const pool = poolDetails as {
                name: string;
                description: string;
                minContribution: bigint;
                maxCoverage: bigint;
                totalFunds: bigint;
                memberCount: number;
              };
              setPools((prev) => [
                ...prev,
                {
                  id: eventData.poolId.toString(),
                  name: pool.name || eventData.name,
                  description:
                    pool.description || "Newly created insurance pool",
                  minContribution:
                    pool.minContribution || BigInt(50000000000000000),
                  maxCoverage: pool.maxCoverage || BigInt(1000000000000000000),
                  totalFunds: pool.totalFunds || BigInt(0),
                  memberCount: pool.memberCount || 1,
                },
              ]);
            } else {
              // If we couldn't get details, just use the event data
              setPools((prev) => [
                ...prev,
                {
                  id: eventData.poolId.toString(),
                  name: eventData.name,
                  description: "Newly created insurance pool",
                  minContribution: BigInt(50000000000000000), // Default 0.05 ETH
                  maxCoverage: BigInt(1000000000000000000), // Default 1 ETH
                  memberCount: 1, // Created with 1 member (the creator)
                  totalFunds: BigInt(0), // Initially no funds
                },
              ]);
            }
          } catch (error) {
            console.error("Error fetching newly created pool details:", error);
            // Add with basic data from the event
            setPools((prev) => [
              ...prev,
              {
                id: eventData.poolId.toString(),
                name: eventData.name,
                description: "Newly created insurance pool",
                minContribution: BigInt(50000000000000000),
                maxCoverage: BigInt(1000000000000000000),
                memberCount: 1,
                totalFunds: BigInt(0),
              },
            ]);
          }
        };

        fetchPoolDetails();
      }
    }
  }, [carInsurance.lastPoolCreatedEvent, pools]);

  // Add this effect to poll for updates
  useEffect(() => {
    if (!address) return;

    // Initial fetch
    const fetchPools = async () => {
      try {
        setFetchingPools(true);
        const allPools = await fetchAllPools();

        // Get the pools the user is a member of
        let userMemberPools: bigint[] = [];
        try {
          if (address) {
            const memberPoolsResult = await publicClient.readContract({
              address: carinsurance_address as Address,
              abi: carinsurance_abi,
              functionName: "getMemberPools",
              args: [address],
            });
            userMemberPools = (memberPoolsResult as bigint[]) || [];
          }
        } catch (error) {
          console.error("Error fetching member pools:", error);
          userMemberPools = [];
        }

        // Create a Set of pool IDs the user is a member of for faster lookups
        const memberPoolIdSet = new Set(
          userMemberPools.map((id) => id.toString())
        );

        // Add the isMember property to each pool
        const poolsWithMembership = allPools.map((pool) => ({
          ...pool,
          isMember: memberPoolIdSet.has(pool.id),
        }));

        setPools(poolsWithMembership);
      } catch (error) {
        console.error("Error in polling fetch:", error);
        setPoolsError(error as Error);
      } finally {
        setFetchingPools(false);
      }
    };

    fetchPools();

    // Set up polling every 30 seconds
    const intervalId = setInterval(fetchPools, 30000);

    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, [address]);

  // Handle joining a pool
  const handleJoinPool = async () => {
    if (!selectedPool || !selectedCarForPool || !contributionAmount) {
      console.error("Missing required data for joining pool:", {
        selectedPool,
        selectedCarForPool,
        contributionAmount,
      });
      alert("Please select a pool, car, and enter a contribution amount.");
      return;
    }

    try {
      setLoading(true);

      // Convert ETH to Wei (or whatever the native token is)
      const contributionInWei = BigInt(
        Math.floor(parseFloat(contributionAmount) * 10 ** 18)
      );

      console.log("Joining pool with parameters:", {
        poolId: selectedPool,
        carId: selectedCarForPool,
        contribution: contributionInWei.toString(),
        contributionInEth: contributionAmount,
      });

      // First, check if the contract needs approval to transfer funds
      const txHash = await carInsurance.joinPool(
        BigInt(selectedPool),
        BigInt(selectedCarForPool),
        contributionInWei
      );

      console.log("Join pool transaction submitted:", txHash);

      // Wait for the transaction to be confirmed
      alert("Transaction submitted! Please wait for confirmation.");

      // After joining, update the pools to reflect membership
      // We'll do a full refresh to ensure data consistency
      setTimeout(async () => {
        try {
          // Get the updated list of pools the user is a member of
          const memberPoolsResult = await publicClient.readContract({
            address: carinsurance_address as Address,
            abi: carinsurance_abi,
            functionName: "getMemberPools",
            args: [address as Address],
          });

          const userMemberPools = (memberPoolsResult as bigint[]) || [];
          const memberPoolIdSet = new Set(
            userMemberPools.map((id) => id.toString())
          );

          // Update the pools with the new membership status
          const updatedPools = pools.map((pool) => {
            if (pool.id === selectedPool) {
              return {
                ...pool,
                isMember: true,
                memberCount: (pool.memberCount ?? 0) + 1,
                totalFunds: (pool.totalFunds ?? BigInt(0)) + contributionInWei,
              };
            }
            return {
              ...pool,
              isMember: memberPoolIdSet.has(pool.id),
            };
          });

          setPools(updatedPools);
          console.log("Pools updated after joining:", updatedPools);

          // Reset the form
          setShowJoinForm(false);
          setSelectedPool(null);
          setContributionAmount("");

          alert("Successfully joined the pool!");
        } catch (error) {
          console.error("Error updating pools after joining:", error);
        }
      }, 5000); // Wait 5 seconds for the transaction to be processed
    } catch (error) {
      console.error("Error joining pool:", error);
      alert(
        `Failed to join pool: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
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

  // Handle creating a new insurance pool
  const handleCreatePool = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !poolFormData.name ||
      !poolFormData.description ||
      !poolFormData.minContribution ||
      !poolFormData.maxCoverage
    ) {
      return;
    }

    try {
      setLoading(true);
      await carInsurance.createPool(
        poolFormData.name,
        poolFormData.description,
        BigInt(parseFloat(poolFormData.minContribution) * 10 ** 18),
        BigInt(parseFloat(poolFormData.maxCoverage) * 10 ** 18)
      );

      setShowCreatePoolForm(false);
      setPoolFormData({
        name: "",
        description: "",
        minContribution: "0.05",
        maxCoverage: "1",
      });
    } catch (error) {
      console.error("Error creating pool:", error);
    } finally {
      setLoading(false);
    }
  };

  // Format a bigint value as ETH
  const formatEth = (value: bigint) => {
    return (Number(value) / 10 ** 18).toFixed(4);
  };

  if (parentLoading || fetchingPools || loadingMemberPools) {
    return (
      <div className="flex justify-center py-8">
        <Loader size={24} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (poolsError) {
    return (
      <div className="rounded-md bg-red-50 p-4 mb-4">
        <div className="flex">
          <AlertCircle size={16} className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error Loading Insurance Pools
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>
                There was a problem loading insurance pools. Please try again
                later.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (pools.length === 0) {
    return (
      <div className="space-y-6">
        <div className="rounded-md bg-yellow-50 p-4 mb-4">
          <div className="flex">
            <AlertCircle size={16} className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                No Insurance Pools Found
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  No insurance pools are currently available on the blockchain.
                  {isAdmin && " As an admin, you can create a new pool below."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Create Pool Button - visible to admins even when no pools exist */}
        {isAdmin && (
          <div className="flex justify-center mt-4">
            <button
              onClick={() => setShowCreatePoolForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus size={16} className="mr-2" />
              Create New Insurance Pool
            </button>
          </div>
        )}

        {/* Create Pool Form */}
        {showCreatePoolForm && (
          <div className="border border-gray-200 rounded-lg shadow-sm bg-gray-50 overflow-hidden mt-6">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-100">
              <h3 className="text-lg font-medium text-gray-900">
                Create New Insurance Pool
              </h3>
            </div>
            <div className="px-4 py-4">
              <form onSubmit={handleCreatePool}>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="poolName"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Pool Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="poolName"
                      type="text"
                      value={poolFormData.name}
                      onChange={(e) =>
                        setPoolFormData({
                          ...poolFormData,
                          name: e.target.value,
                        })
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="poolDescription"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="poolDescription"
                      rows={3}
                      value={poolFormData.description}
                      onChange={(e) =>
                        setPoolFormData({
                          ...poolFormData,
                          description: e.target.value,
                        })
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="minContribution"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Minimum Contribution (ETH){" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="minContribution"
                        type="number"
                        min="0.001"
                        step="0.001"
                        value={poolFormData.minContribution}
                        onChange={(e) =>
                          setPoolFormData({
                            ...poolFormData,
                            minContribution: e.target.value,
                          })
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="maxCoverage"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Maximum Coverage (ETH){" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="maxCoverage"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={poolFormData.maxCoverage}
                        onChange={(e) =>
                          setPoolFormData({
                            ...poolFormData,
                            maxCoverage: e.target.value,
                          })
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreatePoolForm(false)}
                    className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`inline-flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      loading
                        ? "bg-blue-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {loading ? (
                      <>
                        <Loader size={16} className="animate-spin mr-2" />
                        Creating...
                      </>
                    ) : (
                      "Create Pool"
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

  return (
    <div className="space-y-6">
      {/* Create Pool Button - only visible to admins */}
      {isAdmin && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowCreatePoolForm(true)}
            className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus size={14} className="mr-1" />
            Create New Pool
          </button>
        </div>
      )}

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
