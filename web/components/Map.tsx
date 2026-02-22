import { useMap, useMapEvents } from "react-leaflet";
import { useEffect, useState } from "react";
import L from "leaflet";

import "leaflet/dist/leaflet.css";

// Fix Leaflet's default icon missing issue in Next.js
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface MapEventsProps {
  onMapClick?: (lat: number, lng: number) => void;
  bounds?: [number, number][];
}

function MapEvents({ onMapClick, bounds }: MapEventsProps) {
  const map = useMap();

  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });

  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, bounds]);

  return null;
}

interface MapProps {
  center?: [number, number];
  zoom?: number;
  markers?: Array<{
    id: string | number;
    position: [number, number];
    title?: string;
    onClick?: () => void;
  }>;
  onMapClick?: (lat: number, lng: number) => void;
  className?: string;
  style?: React.CSSProperties;
  bounds?: [number, number][];
}

export default function InteractiveMap({
  center = [48.0196, 66.9237], // Kazakhstan center by default
  zoom = 5,
  markers = [],
  onMapClick,
  className,
  style,
  bounds,
}: MapProps) {
  // We need to dynamically import react-leaflet components to avoid SSR issues
  const [Components, setComponents] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const rl = await import("react-leaflet");
      setComponents(rl);
    })();
  }, []);

  if (!Components) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "var(--bg)",
          borderRadius: "var(--radius-lg)",
          color: "var(--text-muted)",
          fontSize: 14,
          ...style,
        }}
        className={className}
      >
        Загрузка карты...
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup } = Components;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ width: "100%", height: "100%", zIndex: 1, ...style }}
      className={className}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapEvents onMapClick={onMapClick} bounds={bounds} />

      {markers.map((marker) => (
        <Marker
          key={marker.id}
          position={marker.position}
          eventHandlers={{
            click: () => {
              if (marker.onClick) marker.onClick();
            },
          }}
        >
          {marker.title && <Popup>{marker.title}</Popup>}
        </Marker>
      ))}
    </MapContainer>
  );
}
