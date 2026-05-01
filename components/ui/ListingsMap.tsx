'use client';

import { useEffect, useRef } from 'react';

interface MapListing {
  id: string;
  title: string;
  locality: string;
  rentAmount: number;
  latitude: number | null;
  longitude: number | null;
  photos: { url: string; isCover: boolean }[];
}

interface Props {
  listings: MapListing[];
  selected: string | null;
  city: string;
  cityLat: number;
  cityLng: number;
  onSelect: (id: string) => void;
}

function fmt(n: number) {
  if (n >= 100000) return `₨${(n / 100000).toFixed(1)}L`;
  return `₨${Math.round(n / 1000)}k`;
}

export default function ListingsMap({ listings, selected, city, cityLat, cityLng, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const markersRef = useRef<Map<string, import('leaflet').Marker>>(new Map());

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Dynamically import leaflet to avoid SSR issues
    import('leaflet').then(L => {
      // Fix default marker icon paths broken by webpack
      // @ts-expect-error leaflet types
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(containerRef.current!, {
        center: [cityLat, cityLng],
        zoom: 13,
        zoomControl: false,
        attributionControl: true,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-centre when city changes
  useEffect(() => {
    mapRef.current?.setView([cityLat, cityLng], 13, { animate: true });
  }, [cityLat, cityLng]);

  // Sync markers when listings change
  useEffect(() => {
    if (!mapRef.current) return;

    import('leaflet').then(L => {
      const map = mapRef.current!;
      const currentIds = new Set(listings.filter(l => l.latitude && l.longitude).map(l => l.id));

      // Remove stale markers
      markersRef.current.forEach((marker, id) => {
        if (!currentIds.has(id)) {
          map.removeLayer(marker);
          markersRef.current.delete(id);
        }
      });

      // Add / update markers
      listings.forEach(l => {
        if (!l.latitude || !l.longitude) return;
        const isSelected = l.id === selected;

        if (markersRef.current.has(l.id)) {
          map.removeLayer(markersRef.current.get(l.id)!);
        }

        const icon = L.divIcon({
          className: '',
          html: `<div style="
            background:${isSelected ? 'var(--n-ink,#15120e)' : '#fff'};
            color:${isSelected ? '#fff' : 'var(--n-ink,#15120e)'};
            border:2px solid ${isSelected ? 'var(--n-ink,#15120e)' : '#ccc'};
            border-radius:999px;
            padding:5px 10px;
            font-family:'Inter Tight',system-ui,sans-serif;
            font-size:12px;
            font-weight:600;
            white-space:nowrap;
            box-shadow:0 3px 12px rgba(0,0,0,${isSelected ? '.35' : '.12'});
            transform:${isSelected ? 'scale(1.12)' : 'scale(1)'};
            transition:all .15s;
            cursor:pointer;
          ">${fmt(l.rentAmount)}</div>`,
          iconAnchor: [30, 18],
        });

        const marker = L.marker([l.latitude, l.longitude], { icon })
          .on('click', () => onSelect(l.id))
          .addTo(map);

        markersRef.current.set(l.id, marker);
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listings, selected]);

  // Pan to selected marker
  useEffect(() => {
    if (!selected || !mapRef.current) return;
    const listing = listings.find(l => l.id === selected);
    if (listing?.latitude && listing?.longitude) {
      mapRef.current.panTo([listing.latitude, listing.longitude], { animate: true });
    }
  }, [selected, listings]);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        crossOrigin=""
      />
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </>
  );
}
