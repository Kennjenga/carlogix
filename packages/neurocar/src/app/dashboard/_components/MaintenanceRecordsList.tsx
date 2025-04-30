"use client";

import React from "react";
import { format } from "date-fns";
import { Wrench, Clock, MapPin } from "lucide-react";
import { useMaintenanceRecords } from "@/blockchain/hooks/useCarNFT";
// import { MaintenanceRecord } from "@/types";

interface MaintenanceRecordsListProps {
  tokenId: string;
}

export default function MaintenanceRecordsList({
  tokenId,
}: MaintenanceRecordsListProps) {
  const {
    data: records,
    isLoading,
    error,
  } = useMaintenanceRecords(BigInt(tokenId));

  if (isLoading) {
    return (
      <div className="p-6 text-center">Loading maintenance records...</div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600">
        Error loading maintenance records
      </div>
    );
  }

  if (!records || records.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        No maintenance records found
      </div>
    );
  }

  const sortedRecords = [...records].sort(
    (a, b) => Number(b.timestamp) - Number(a.timestamp)
  );

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-600 mb-1">
            Total Records
          </h3>
          <p className="text-2xl font-semibold text-gray-900">
            {records.length}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-600 mb-1">
            Latest Service
          </h3>
          <p className="text-2xl font-semibold text-gray-900">
            {format(
              new Date(Number(sortedRecords[0].timestamp) * 1000),
              "MMM d, yyyy"
            )}
          </p>
        </div>
      </div>

      {/* Records Timeline */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Maintenance History
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {sortedRecords.map((record, index) => (
            <div key={index} className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Wrench className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-medium text-gray-900">
                      {record.description}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {format(
                        new Date(Number(record.timestamp) * 1000),
                        "MMM d, yyyy"
                      )}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>Mileage: {record.mileage.toString()} miles</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{record.serviceProvider}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
