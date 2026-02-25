/**
 * LocationMapTile.tsx
 *
 * Displays a Google Maps Static API satellite tile for a resolved location.
 * Uses VITE_GOOGLE_MAPS_API_KEY — no JS SDK needed, just a plain <img>.
 *
 * Shows automatically once LocationCard.lat + LocationCard.lng are available.
 * Falls back silently (renders nothing) if key missing or image fails to load.
 */

import React, { useState } from "react";

const GOOGLE_MAPS_API_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) ?? "";

interface LocationMapTileProps {
  lat: number;
  lng: number;
  /** Optional label shown as overlay text (city, state) */
  label?: string;
  /** Zoom level — 13 shows neighborhood context, 15 shows street detail */
  zoom?: number;
}

/**
 * Build a Google Maps Static API URL.
 * Using satellite maptype with a custom blue pin.
 * scale=2 for retina displays; size=640x200 = 1280x400 physical px.
 */
function buildStaticMapUrl(lat: number, lng: number, zoom: number): string {
  const params = new URLSearchParams({
    center: `${lat},${lng}`,
    zoom: String(zoom),
    size: "640x180",
    scale: "2",
    maptype: "hybrid", // Satellite + road labels — best visual + context
    key: GOOGLE_MAPS_API_KEY,
  });
  // Custom blue pin marker — matches Merlin #4F8CFF palette
  params.append("markers", `color:0x4F8CFF|${lat},${lng}`);
  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
}

export default function LocationMapTile({ lat, lng, label, zoom = 14 }: LocationMapTileProps) {
  const [failed, setFailed] = useState(false);

  // Don't render without valid coordinates or API key
  if (!GOOGLE_MAPS_API_KEY || !lat || !lng || failed) return null;

  const mapUrl = buildStaticMapUrl(lat, lng, zoom);

  return (
    <div
      style={{
        borderRadius: 14,
        overflow: "hidden",
        position: "relative",
        border: "1px solid rgba(255, 255, 255, 0.07)",
        background: "rgba(0, 0, 0, 0.3)",
        marginTop: 2,
        flexShrink: 0,
      }}
    >
      {/* Satellite tile */}
      <img
        src={mapUrl}
        alt={label ? `Satellite map of ${label}` : "Location satellite map"}
        style={{
          width: "100%",
          display: "block",
          maxHeight: 180,
          objectFit: "cover",
        }}
        onError={() => setFailed(true)}
      />

      {/* Bottom gradient overlay — darkens the bottom edge for label contrast */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 56,
          background: "linear-gradient(transparent, rgba(8, 10, 22, 0.88))",
          display: "flex",
          alignItems: "flex-end",
          padding: "0 14px 10px",
          gap: 5,
          pointerEvents: "none",
        }}
      >
        <span style={{ fontSize: 11 }}>📍</span>
        {label && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "rgba(232, 235, 243, 0.80)",
              letterSpacing: "0.15px",
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </span>
        )}
        <span
          style={{
            fontSize: 9,
            color: "rgba(232, 235, 243, 0.25)",
            fontWeight: 500,
            marginLeft: "auto",
            flexShrink: 0,
          }}
        >
          © Google
        </span>
      </div>

      {/* Top-right corner: subtle SATELLITE badge */}
      <div
        style={{
          position: "absolute",
          top: 8,
          right: 10,
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: "0.5px",
          textTransform: "uppercase",
          color: "rgba(232, 235, 243, 0.45)",
          background: "rgba(0, 0, 0, 0.45)",
          padding: "3px 7px",
          borderRadius: 5,
          pointerEvents: "none",
        }}
      >
        Satellite
      </div>
    </div>
  );
}
