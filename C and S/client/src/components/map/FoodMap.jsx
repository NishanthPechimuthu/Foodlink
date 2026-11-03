import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Clock, MapPin, Package, ArrowRight, ShieldCheck } from 'lucide-react';

// Custom marker icon creator using HTML/Tailwind styling
const createFoodMarkerIcon = (category, isAvailable = true) => {
  let emoji = '🍲';
  let bgColor = '#CC5500'; // Burnt orange

  switch (category) {
    case 'Cooked Meals':
      emoji = '🍲';
      bgColor = '#CC5500';
      break;
    case 'Fresh Produce':
      emoji = '🥦';
      bgColor = '#2E7D32'; // Sage green
      break;
    case 'Bakery & Grains':
      emoji = '🥖';
      bgColor = '#D97706'; // Amber
      break;
    case 'Dairy & Milk':
      emoji = '🥛';
      bgColor = '#2563EB'; // Blue
      break;
    case 'Packaged Food':
      emoji = '🥫';
      bgColor = '#7C3AED'; // Purple
      break;
    default:
      emoji = '🥗';
      bgColor = '#4E342E';
  }

  const html = `
    <div style="
      background-color: ${bgColor};
      width: 36px;
      height: 36px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 3px solid white;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      cursor: pointer;
      transition: transform 0.2s ease;
    ">
      <span style="
        transform: rotate(45deg);
        font-size: 16px;
        line-height: 1;
      ">${emoji}</span>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-food-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
};

// Component to dynamically fit map bounds around listings
function ChangeView({ bounds, center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    } else if (center) {
      map.setView(center, zoom || 12);
    }
  }, [bounds, center, zoom, map]);
  return null;
}

export default function FoodMap({
  listings = [],
  onSelectListing,
  height = '500px',
  singleListing = null,
  interactive = true,
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        style={{ height }}
        className="w-full bg-cream-100 rounded-2xl flex items-center justify-center border border-secondary-200"
      >
        <span className="text-secondary-500 text-sm">Loading map view...</span>
      </div>
    );
  }

  // Handle single listing mini-map vs. multi-listing explore map
  const activeListings = singleListing ? [singleListing] : listings;

  // Extract coordinates, fallback to Connaught Place New Delhi [28.6328, 77.2185]
  const validMarkers = activeListings
    .map((item) => {
      let lat = 28.6328;
      let lng = 77.2185;

      if (
        item.location &&
        Array.isArray(item.location.coordinates) &&
        item.location.coordinates.length === 2
      ) {
        // GeoJSON Point is [lng, lat]
        lng = item.location.coordinates[0];
        lat = item.location.coordinates[1];
      }

      return {
        ...item,
        coords: [lat, lng],
      };
    })
    .filter((item) => !isNaN(item.coords[0]) && !isNaN(item.coords[1]));

  const center =
    validMarkers.length > 0 ? validMarkers[0].coords : [28.6139, 77.209];

  const bounds =
    validMarkers.length > 1 ? validMarkers.map((m) => m.coords) : null;

  const formatAddress = (addr) => {
    if (!addr) return 'Delhi NCR';
    if (typeof addr === 'string') return addr;
    return [addr.street, addr.city, addr.state].filter(Boolean).join(', ') || 'Delhi NCR';
  };

  return (
    <div
      style={{ height }}
      className="w-full rounded-2xl overflow-hidden border border-secondary-200 shadow-sm relative z-0"
    >
      <MapContainer
        center={center}
        zoom={singleListing ? 14 : 12}
        scrollWheelZoom={interactive}
        dragging={interactive}
        touchZoom={interactive}
        doubleClickZoom={interactive}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ChangeView bounds={bounds} center={center} zoom={singleListing ? 14 : 12} />

        {validMarkers.map((listing) => (
          <Marker
            key={listing._id || listing.id}
            position={listing.coords}
            icon={createFoodMarkerIcon(listing.category, listing.status === 'Available')}
          >
            <Popup className="custom-popup" maxWidth={280}>
              <div className="p-1">
                {listing.images && listing.images[0] && (
                  <img
                    src={listing.images[0]}
                    alt={listing.title}
                    className="w-full h-24 object-cover rounded-lg mb-2"
                  />
                )}
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cream-200 text-chocolate">
                    {listing.category}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {listing.availableQuantity} {listing.quantityUnit} left
                  </span>
                </div>
                <h4 className="font-heading font-bold text-sm text-secondary-900 leading-tight mb-1">
                  {listing.title}
                </h4>
                <p className="text-xs text-secondary-600 flex items-center gap-1 mb-2">
                  <MapPin className="w-3.5 h-3.5 text-secondary-400 shrink-0" />
                  <span className="truncate">{formatAddress(listing.pickupAddress)}</span>
                </p>
                {onSelectListing && (
                  <button
                    onClick={() => onSelectListing(listing)}
                    className="w-full py-1.5 px-3 bg-burntOrange hover:bg-burntOrange-600 text-white font-heading font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span>View & Request</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
