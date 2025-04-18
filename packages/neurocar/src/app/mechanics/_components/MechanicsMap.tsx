// _components/MechanicsMap.tsx

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Icon } from "leaflet";
import { Mechanic } from "@/types";

interface MechanicsMapProps {
  userLocation: [number, number];
  mechanics: Mechanic[];
}

const MechanicsMap = ({ userLocation, mechanics }: MechanicsMapProps) => {
  // Custom icons for markers
  const mechanicIcon = new Icon({
    iconUrl: "/mechanic-marker.png", // Add this image to your public folder
    iconSize: [35, 51],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  const userIcon = new Icon({
    iconUrl: "/user-marker.png", // Add this image to your public folder
    iconSize: [35, 51],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  return (
    <MapContainer
      center={userLocation}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* User Location Marker */}
      <Marker position={userLocation} icon={userIcon}>
        <Popup>Your Location</Popup>
      </Marker>

      {/* Mechanic Markers */}
      {mechanics.map((mechanic) => (
        <Marker
          key={mechanic.id}
          position={[mechanic.latitude, mechanic.longitude]}
          icon={mechanicIcon}
        >
          <Popup>
            <div className="min-w-[200px]">
              <h3 className="font-semibold">{mechanic.name}</h3>
              <p className="text-sm">{mechanic.specialization}</p>
              <p className="text-sm">Rating: {mechanic.rating} ⭐</p>
              <a
                href={`tel:${mechanic.phone}`}
                className="mt-2 inline-block bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-600 transition-colors"
              >
                Call: {mechanic.phone}
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MechanicsMap;
