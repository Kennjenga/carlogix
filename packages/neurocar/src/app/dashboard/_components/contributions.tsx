"use client";

import { useCarInsuranceData } from "@/blockchain/hooks/useCarInsurance";
import { formatEther } from "viem";
import { useEffect, useState } from "react";

export default function ContributionHistory({ poolId }: { poolId: string }) {
  const { getUserContributionHistory } = useCarInsuranceData();

  // Removed unused fetchUserContributionHistory function
  interface Contribution {
    timestamp: bigint;
    amount: bigint;
    contributionType: string;
  }

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);

  useEffect(() => {
    async function fetchContributions() {
      try {
        setLoading(true);
        const result = (await getUserContributionHistory(BigInt(poolId))) as
          | { contributions: Contribution[] }
          | undefined;
        setContributions(result?.contributions || []);
        setError(null);
      } catch {
        setError("Failed to fetch contributions.");
      } finally {
        setLoading(false);
      }
    }

    fetchContributions();
  }, [poolId, getUserContributionHistory]);
  const [showAll, setShowAll] = useState(false);

  if (loading)
    return (
      <div className="p-4 text-center">Loading contribution history...</div>
    );
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;
  if (!contributions || contributions.length === 0) {
    return (
      <div className="p-4 text-center">
        No contribution history found for this pool.
      </div>
    );
  }

  // Sort contributions by timestamp (newest first)
  const sortedContributions = [...contributions].sort((a, b) =>
    Number(b.timestamp - a.timestamp)
  );

  // Display only the last 5 contributions unless showAll is true
  const displayContributions = showAll
    ? sortedContributions
    : sortedContributions.slice(0, 5);

  // Calculate total contribution
  const totalContribution = contributions.reduce(
    (sum, record) => sum + record.amount,
    BigInt(0)
  );

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-4">Contribution History</h3>

      <div className="mb-4 p-3 bg-blue-50 rounded-md">
        <p className="font-medium">
          Total Contributed: {formatEther(totalContribution)} ETH
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayContributions.map((record, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(
                    Number(record.timestamp) * 1000
                  ).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatEther(record.amount)} ETH
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {record.contributionType}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {contributions.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          {showAll ? "Show Less" : `Show All (${contributions.length})`}
        </button>
      )}
    </div>
  );
}
