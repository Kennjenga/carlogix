// Home.tsx - Main page component with responsive design
"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Mechanic } from "@/types";
import { supabase } from "@/utils/supabase";

const MechanicsMap = dynamic(() => import("./_components/MechanicsMap"), {
  ssr: false,
});

export default function Home() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  );
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showMap, setShowMap] = useState(true); // For mobile view toggling

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([
            position.coords.latitude,
            position.coords.longitude,
          ]);
          fetchNearbyMechanicsFromSupabase();
        },
        (error) => {
          console.error("Error getting location:", error);
          setLoading(false);
        }
      );
    } else {
      fetchNearbyMechanicsFromSupabase();
    }
  }, []);

  const fetchNearbyMechanicsFromSupabase = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("mechanics").select("*");

      if (error) {
        console.error("Error fetching mechanics from Supabase:", error);
        setLoading(false);
        return;
      }

      if (data) {
        setMechanics(data);
      }
    } catch (error) {
      console.error("An unexpected error occurred:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMechanics = mechanics.filter(
    (mechanic) =>
      mechanic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mechanic.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading Mechanics...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile View Toggle Buttons */}
      <div className="md:hidden flex sticky top-0 z-10 bg-white shadow-md">
        <button
          onClick={() => setShowMap(false)}
          className={`flex-1 py-3 font-medium ${
            !showMap ? "bg-blue-500 text-white" : "bg-gray-100"
          }`}
        >
          List
        </button>
        <button
          onClick={() => setShowMap(true)}
          className={`flex-1 py-3 font-medium ${
            showMap ? "bg-blue-500 text-white" : "bg-gray-100"
          }`}
        >
          Map
        </button>
      </div>

      {/* Left Side - List and Search */}
      <div
        className={`
          w-full md:w-1/3 p-4 overflow-y-auto 
          ${showMap ? "hidden md:block" : "block"} 
          h-[calc(100vh-48px)] md:h-screen md:border-r
        `}
      >
        <h1 className="text-2xl font-bold mb-4">Nearby Mechanics</h1>

        {/* Search Box */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search mechanics..."
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg
              className="absolute right-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Mechanics List */}
        <div className="space-y-4">
          {filteredMechanics.length > 0 ? (
            filteredMechanics.map((mechanic) => (
              <div
                key={mechanic.id}
                className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{mechanic.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {mechanic.specialization}
                    </p>
                    <div className="flex items-center mt-1">
                      <span className="text-sm text-yellow-500">
                        {mechanic.rating} ⭐
                      </span>
                    </div>
                  </div>
                  <a
                    href={`tel:${mechanic.phone}`}
                    className="flex items-center justify-center bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors mt-3 sm:mt-0"
                  >
                    <svg
                      className="h-4 w-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    Call {mechanic.phone}
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-gray-500">
              No mechanics found. Try adjusting your search.
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Map */}
      <div
        className={`
          w-full md:w-2/3 
          ${showMap ? "block" : "hidden md:block"} 
          h-[calc(100vh-48px)] md:h-screen
        `}
      >
        {userLocation && mechanics.length > 0 && (
          <MechanicsMap
            userLocation={userLocation}
            mechanics={filteredMechanics}
          />
        )}
      </div>

      {/* Floating button to quickly toggle on mobile */}
      <button
        onClick={() => setShowMap(!showMap)}
        className="md:hidden fixed bottom-6 right-6 z-10 bg-blue-500 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg"
      >
        {showMap ? (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        ) : (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
        )}
      </button>
    </main>
  );
}
