'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Navigation, Star, ArrowRight } from 'lucide-react';

interface ParkingMarker {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  startingPrice: number;
  availableSlots: number;
  rating: number;
  address: string;
}

interface LeafletMapProps {
  locations: ParkingMarker[];
  selectedId?: string;
  onSelectLocation?: (id: string) => void;
  centerLat?: number;
  centerLng?: number;
  userLat?: number;
  userLng?: number;
}

// Client-side dynamic Leaflet renderer to avoid SSR window error
const ClientMap = dynamic(
  () =>
    import('react-leaflet').then((mod) => {
      const { MapContainer, TileLayer, Marker, Popup, useMap } = mod;
      const L = require('leaflet');

      // Helper component to center map smoothly when selected location changes
      const RecenterMap = ({ lat, lng }: { lat: number; lng: number }) => {
        const map = useMap();
        useEffect(() => {
          if (lat && lng) {
            map.flyTo([lat, lng], 14, { duration: 1.2 });
          }
        }, [lat, lng, map]);
        return null;
      };

      return function InnerMap({
        locations,
        selectedId,
        onSelectLocation,
        centerLat = 12.9716,
        centerLng = 77.5946,
        userLat,
        userLng,
      }: LeafletMapProps) {
        // Custom HTML Price Marker Icon
        const createPriceIcon = (price: number, isSelected: boolean) => {
          return L.divIcon({
            className: 'custom-price-marker',
            html: `
              <div style="
                background-color: ${isSelected ? '#059669' : '#0f172a'};
                color: white;
                font-weight: 700;
                font-size: 12px;
                padding: 4px 8px;
                border-radius: 12px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                border: 2px solid ${isSelected ? '#ffffff' : '#334155'};
                white-space: nowrap;
                transform: scale(${isSelected ? '1.15' : '1.0'});
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 4px;
              ">
                <span>₹${price}/hr</span>
              </div>
            `,
            iconSize: [60, 30],
            iconAnchor: [30, 15],
          });
        };

        const createUserIcon = () => {
          return L.divIcon({
            className: 'custom-user-marker',
            html: `
              <div style="
                background-color: #2563eb;
                width: 18px;
                height: 18px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 0 0 8px rgba(37, 99, 235, 0.3);
              "></div>
            `,
            iconSize: [18, 18],
            iconAnchor: [9, 9],
          });
        };

        return (
          <MapContainer
            center={[centerLat, centerLng]}
            zoom={13}
            scrollWheelZoom={true}
            className="w-full h-full rounded-2xl z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <RecenterMap lat={centerLat} lng={centerLng} />

            {/* User Location Marker */}
            {userLat && userLng && (
              <Marker position={[userLat, userLng]} icon={createUserIcon()}>
                <Popup>Your Current Location</Popup>
              </Marker>
            )}

            {/* Parking Location Markers */}
            {locations.map((loc) => {
              const isSelected = loc.id === selectedId;
              return (
                <Marker
                  key={loc.id}
                  position={[loc.latitude, loc.longitude]}
                  icon={createPriceIcon(loc.startingPrice, isSelected)}
                  eventHandlers={{
                    click: () => onSelectLocation && onSelectLocation(loc.id),
                  }}
                >
                  <Popup className="custom-leaflet-popup">
                    <div className="p-1 space-y-1.5 min-w-[200px]">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {loc.availableSlots} slots left
                        </span>
                        <span className="flex items-center gap-1 text-xs font-bold text-amber-600">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {loc.rating}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">{loc.name}</h4>
                      <p className="text-xs text-slate-500 truncate">{loc.address}</p>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <span className="text-xs font-bold text-slate-800">₹{loc.startingPrice}/hr</span>
                        <button
                          onClick={() => onSelectLocation && onSelectLocation(loc.id)}
                          className="text-xs text-brand-600 font-bold hover:underline flex items-center gap-1"
                        >
                          View Details <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        );
      };
    }),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-400 gap-2">
        <MapPin className="w-8 h-8 animate-bounce text-brand-500" />
        <span className="text-sm font-semibold">Loading Interactive Map...</span>
      </div>
    ),
  }
);

export const LeafletMap: React.FC<LeafletMapProps> = (props) => {
  return <ClientMap {...props} />;
};
