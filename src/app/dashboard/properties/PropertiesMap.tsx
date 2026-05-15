"use client";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { useRouter } from "next/navigation";

// Fix Leaflet's broken default icon paths in Next.js
const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function FitBounds({ properties }: { properties: any[] }) {
  const map = useMap();
  useEffect(() => {
    const points = properties.filter(
      (p) => p.location?.latitude && p.location?.longitude
    );
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].location.latitude, points[0].location.longitude], 13);
      return;
    }
    const bounds = L.latLngBounds(
      points.map((p) => [p.location.latitude, p.location.longitude])
    );
    map.fitBounds(bounds, { padding: [48, 48] });
  }, [properties, map]);
  return null;
}

export default function PropertiesMap({ properties }: { properties: any[] }) {
  const router = useRouter();
  const mapped = properties.filter(
    (p) => p.location?.latitude && p.location?.longitude
  );
  const unmapped = properties.length - mapped.length;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-md" style={{ height: "70vh" }}>
      <MapContainer
        center={[32.9, 13.18]}
        zoom={6}
        className="w-full h-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds properties={properties} />
        {mapped.map((property) => (
          <Marker
            key={property.id}
            position={[property.location.latitude, property.location.longitude]}
            icon={markerIcon}
          >
            <Popup minWidth={200}>
              <div className="space-y-1">
                {property.images?.[0] || property.imageUrl ? (
                  <img
                    src={property.images?.[0] || property.imageUrl}
                    alt={property.locationTitle}
                    className="w-full h-24 object-cover rounded"
                  />
                ) : null}
                <p className="font-semibold text-sm leading-tight mt-1">
                  {property.locationTitle}
                </p>
                {property.location?.address && (
                  <p className="text-xs text-gray-500">{property.location.address}</p>
                )}
                <p className="text-xs text-gray-600">
                  {property.placeType} · {property.ownerPropertyName}
                </p>
                <button
                  onClick={() => router.push(`/dashboard/properties/${property.id}`)}
                  className="mt-1 w-full bg-blue-500 text-white text-xs py-1.5 rounded hover:bg-blue-600 transition"
                >
                  View Property
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {unmapped > 0 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/90 text-xs text-gray-500 px-3 py-1 rounded-full shadow z-[1000]">
          {unmapped} {unmapped === 1 ? "property has" : "properties have"} no coordinates and are hidden
        </div>
      )}
    </div>
  );
}
