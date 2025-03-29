// src/app/mymech/_components/VehicleSelector.tsx
import React from "react";
import { Car } from "lucide-react";
import { CarWithId } from "@/types";

interface VehicleSelectorProps {
  cars: CarWithId[];
  selectedCar: CarWithId | null;
  onSelectCar: (car: CarWithId) => void;
}

export default function VehicleSelector({
  cars,
  selectedCar,
  onSelectCar,
}: VehicleSelectorProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Your Vehicles
      </h2>

      <div className="space-y-2">
        {cars.map((car) => (
          <div
            key={car.id}
            onClick={() => onSelectCar(car)}
            className={`p-3 rounded-md cursor-pointer transition-colors ${
              selectedCar?.id === car.id
                ? "bg-blue-50 border border-blue-200"
                : "hover:bg-gray-50 border border-gray-100"
            }`}
          >
            <div className="flex items-center">
              <Car size={20} className="text-blue-600 mr-2 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-gray-900">
                  {car.make} {car.model}
                </h3>
                <p className="text-sm text-gray-500">
                  {car.year} • {car.mileage} miles
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
