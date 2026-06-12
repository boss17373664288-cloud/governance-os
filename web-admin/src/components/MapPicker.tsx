"use client";

import React, { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface MapPickerProps {
  autoLocateAddress?: string;
  lat?: number;
  lng?: number;
  address?: string;
  onChange: (lat: number, lng: number) => void;
}

function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

async function geocodeAddress(address: string): Promise<{lat: number; lng: number} | null> {
  if (!address || address.length < 3) return null;
  // Clean address: remove floor (樓), remove specific number (號 + digits)
  let cleaned = address.replace(/\d+號\d*樓?/g, "").replace(/\d+號?/g, "").trim();
  if (!cleaned || cleaned.length < 2) cleaned = address;
  // Try full address first, then cleaned version
  const queries = [address, cleaned, cleaned + " Taiwan"];
  for (const q of queries) {
    try {
      const res = await fetch("https://nominatim.openstreetmap.org/search?format=json&limit=3&q=" + encodeURIComponent(q));
      const data = await res.json();
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    } catch {}
  }
  return null;
}

function SearchBox({ onSelect }: { onSelect: (lat: number, lng: number, name: string) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const map = useMap();

  const handleSearch = useCallback(async () => {
    if (query.length < 2) return;
    setSearching(true);
    try {
      const res = await fetch(
        "https://nominatim.openstreetmap.org/search?format=json&limit=5&q=" + encodeURIComponent(query)
      );
      const data = await res.json();
      setResults(data || []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [query]);

  return (
    <div style={{ position: "absolute", top: 10, left: 10, zIndex: 1000, background: "white", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.15)", width: 280 }}>
      <div style={{ display: "flex", padding: 8, gap: 6 }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="輸入地址搜尋..."
          style={{ flex: 1, padding: "6px 10px", border: "1px solid #d9d9d9", borderRadius: 4, fontSize: 13, outline: "none" }}
        />
        <button onClick={handleSearch} disabled={searching} style={{ padding: "6px 12px", background: "#165DFF", color: "white", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" }}>
          {searching ? "..." : "搜尋"}
        </button>
      </div>
      {results.length > 0 && (
        <div style={{ maxHeight: 200, overflow: "auto" }}>
          {results.map((r: any, i: number) => (
            <div
              key={i}
              onClick={() => {
                const lat = parseFloat(r.lat);
                const lng = parseFloat(r.lon);
                onSelect(lat, lng, r.display_name);
                map.setView([lat, lng], 16);
                setResults([]);
              }}
              style={{ padding: "6px 10px", cursor: "pointer", fontSize: 12, borderBottom: "1px solid #f0f0f0", lineHeight: 1.4 }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f5ff")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {r.display_name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


// Fly map to position when it changes
function FlyTo({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, 15);
    }
  }, [position]);
  return null;
}
export default function MapPicker({ lat, lng, address, autoLocateAddress, onChange }: MapPickerProps) {
  const [position, setPosition] = useState<[number, number] | null>(
    lat && lng ? [lat, lng] : null
  );
  const defaultCenter: [number, number] = position || [25.033, 121.565];
  const [autoLocating, setAutoLocating] = useState(false);

  const handleAutoLocate = async () => {
    if (!autoLocateAddress) return;
    setAutoLocating(true);
    const coords = await geocodeAddress(autoLocateAddress);
    if (coords) {
      setPosition([coords.lat, coords.lng]);
      onChange(coords.lat, coords.lng);
    }
    setAutoLocating(false);
  };

  useEffect(() => {
    if (lat && lng) setPosition([lat, lng]);
  }, [lat, lng]);

  const handleClick = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    onChange(lat, lng);
  };

  const handleSearchSelect = (lat: number, lng: number, _name: string) => {
    setPosition([lat, lng]);
    onChange(lat, lng);
  };

  return (
    <div style={{ position: "relative", width: "100%", height: 500, borderRadius: 8, overflow: "hidden", border: "1px solid #e5e6eb", background: "#fff" }}>
      <MapContainer center={defaultCenter} zoom={13} style={{ width: "100%", height: "100%" }} scrollWheelZoom={true}>
        {autoLocateAddress && (
          <div style={{ position: "absolute", top: 10, right: 10, zIndex: 1000 }}>
            <button
              onClick={handleAutoLocate}
              disabled={autoLocating}
              style={{
                padding: "6px 14px",
                background: "#165DFF",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: 13,
                whiteSpace: "nowrap",
                boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
              }}
            >
              {autoLocating ? "定位中..." : "📍 從地址自動定位"}
            </button>
          </div>
        )}
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <SearchBox onSelect={handleSearchSelect} />
        <MapClickHandler onClick={handleClick} />
        <FlyTo position={position} />
        {position && <Marker position={position} />}
      </MapContainer>
      {position && (
        <div style={{
          position: "absolute",
          bottom: 8,
          right: 8,
          background: "rgba(0,0,0,0.7)",
          color: "white",
          padding: "4px 10px",
          borderRadius: 4,
          fontSize: 12,
          zIndex: 1000
        }}>
          {position[0].toFixed(6)}, {position[1].toFixed(6)}
        </div>
      )}
    </div>
  );
}
