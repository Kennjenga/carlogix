// _components/MechanicsMap.tsx - Responsive map component
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Icon } from "leaflet";
import { Mechanic } from "@/types";

interface MechanicsMapProps {
  userLocation: [number, number];
  mechanics: Mechanic[];
}

// Component to recenter map when userLocation changes
function RecenterMap({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position);
  }, [position, map]);
  return null;
}

const MechanicsMap = ({ userLocation, mechanics }: MechanicsMapProps) => {
  const [isMapReady, setIsMapReady] = useState(false);

  // Custom icons for markers
  const mechanicIcon = new Icon({
    iconUrl: "/mechanic-marker.png",
    iconSize: [35, 51],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  const userIcon = new Icon({
    iconUrl: "/user-marker.png",
    iconSize: [35, 51],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  // Make sure Leaflet is available (client-side only)
  useEffect(() => {
    setIsMapReady(true);
  }, []);

  if (!isMapReady) return null;

  return (
    <MapContainer
      center={userLocation}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <RecenterMap position={userLocation} />

      {/* User Location Marker */}
      <Marker position={userLocation} icon={userIcon}>
        <Popup>
          <div className="font-semibold">Your Location</div>
        </Popup>
      </Marker>

      {/* Mechanic Markers */}
      {mechanics.map((mechanic) => (
        <Marker
          key={mechanic.id}
          position={[mechanic.latitude, mechanic.longitude]}
          icon={mechanicIcon}
        >
          <Popup>
            <div className="min-w-[200px] p-1">
              <h3 className="font-semibold text-lg">{mechanic.name}</h3>
              <p className="text-sm">{mechanic.specialization}</p>
              <p className="text-sm">Rating: {mechanic.rating} ⭐</p>
              <div className="flex gap-2 mt-3">
                <a
                  href={`tel:${mechanic.phone}`}
                  className="flex-1 text-center bg-blue-500 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-600 transition-colors"
                >
                  Call
                </a>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${mechanic.latitude},${mechanic.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center bg-green-500 text-white px-3 py-2 rounded-md text-sm hover:bg-green-600 transition-colors"
                >
                  Directions
                </a>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MechanicsMap;
