'use client';

// Leaflet + OpenStreetMap map. This module touches `window` when loading
// Leaflet, so always import it with next/dynamic and ssr: false.

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useTranslations } from 'next-intl';
import 'leaflet/dist/leaflet.css';

// Default center: Santa Cruz de la Sierra.
const DEFAULT_CENTER: [number, number] = [-17.7833, -63.1821];
const DEFAULT_ZOOM = 12;
const PIN_ZOOM = 15;

// divIcon avoids the bundling issues with Leaflet's icon assets.
const pinIcon = L.divIcon({
  className: '',
  html: '<span style="font-size:30px;line-height:30px;filter:drop-shadow(0 1px 1px rgba(0,0,0,.4))">📍</span>',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

function createMap(el: HTMLElement, center: [number, number], zoom: number) {
  const map = L.map(el).setView(center, zoom);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap',
  }).addTo(map);
  // The container may finish measuring after init (e.g. when mounted
  // inside the modal): recompute the size on the next tick.
  setTimeout(() => map.invalidateSize(), 0);
  return map;
}

// Readable place name (best effort, to prefill the text field).
async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=16&accept-language=es`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      address?: Record<string, string>;
      display_name?: string;
    };
    const a = data.address ?? {};
    const parts = [
      a.suburb ?? a.neighbourhood ?? a.road,
      a.city ?? a.town ?? a.village ?? a.state,
    ].filter(Boolean);
    return parts.length ? parts.join(', ') : (data.display_name ?? null);
  } catch {
    return null;
  }
}

// Picker canvas: click or drag the pin, "my location" button and sync with
// the props (so the small map reflects what was picked in the enlarged one
// and vice versa). Mounted by MapPicker and its modal at different sizes.
function PickerMap({
  lat,
  lng,
  onChange,
  onPlace,
  className,
}: {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
  onPlace?: (name: string) => void;
  className: string;
}) {
  const t = useTranslations('map');
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Callbacks in refs so the map isn't recreated when they change.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onPlaceRef = useRef(onPlace);
  onPlaceRef.current = onPlace;

  function placePin(map: L.Map, point: L.LatLng) {
    if (!markerRef.current) {
      markerRef.current = L.marker(point, { icon: pinIcon, draggable: true })
        .addTo(map)
        .on('dragend', () => {
          const p = markerRef.current!.getLatLng();
          notify(p);
        });
    } else {
      markerRef.current.setLatLng(point);
    }
  }

  function notify(p: L.LatLng) {
    onChangeRef.current(p.lat, p.lng);
    if (onPlaceRef.current) {
      reverseGeocode(p.lat, p.lng).then(
        (name) => name && onPlaceRef.current?.(name),
      );
    }
  }

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const hasPin = lat != null && lng != null;
    const center: [number, number] = hasPin ? [lat!, lng!] : DEFAULT_CENTER;
    const map = createMap(containerRef.current, center, hasPin ? PIN_ZOOM : DEFAULT_ZOOM);
    mapRef.current = map;

    if (hasPin) placePin(map, L.latLng(lat!, lng!));

    map.on('click', (e: L.LeafletMouseEvent) => {
      placePin(map, e.latlng);
      notify(e.latlng);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Initialization only: later changes arrive via the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pin moved from another instance (modal ↔ small map): sync.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || lat == null || lng == null) return;
    const current = markerRef.current?.getLatLng();
    if (
      current &&
      Math.abs(current.lat - lat) < 1e-9 &&
      Math.abs(current.lng - lng) < 1e-9
    ) {
      return;
    }
    const point = L.latLng(lat, lng);
    placePin(map, point);
    map.setView(point, Math.max(map.getZoom(), PIN_ZOOM));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);

  function useMyLocation() {
    navigator.geolocation?.getCurrentPosition((pos) => {
      const point = L.latLng(pos.coords.latitude, pos.coords.longitude);
      const map = mapRef.current;
      if (!map) return;
      map.setView(point, PIN_ZOOM);
      placePin(map, point);
      notify(point);
    });
  }

  return (
    <div className="relative z-0 h-full w-full">
      <div ref={containerRef} className={className} />
      <button
        type="button"
        onClick={useMyLocation}
        className="absolute bottom-2 left-2 z-[1001] border border-outline-variant bg-surface-container-lowest/95 px-2 py-1 text-xs font-medium text-on-surface-variant shadow-aceternity hover:text-primary"
      >
        📍 {t('useMyLocation')}
      </button>
    </div>
  );
}

// Location picker with an expandable view (modal), as in the detail page.
// Leaflet panes use high z-indexes: the `relative z-0` wrapper encloses
// them in their own stacking context so they don't cover the modal.
export function MapPicker({
  lat,
  lng,
  onChange,
  onPlace,
}: {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
  onPlace?: (name: string) => void;
}) {
  const t = useTranslations('map');
  const [expanded, setExpanded] = useState(false);

  // Close the modal with Escape.
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setExpanded(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expanded]);

  return (
    <div className="space-y-1">
      <div className="relative z-0">
        <PickerMap
          lat={lat}
          lng={lng}
          onChange={onChange}
          onPlace={onPlace}
          className="h-64 w-full border border-outline-variant"
        />
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="absolute right-2 top-2 z-[1001] border border-outline-variant bg-surface-container-lowest/95 px-2 py-1 text-xs font-medium text-on-surface-variant shadow-aceternity hover:text-primary"
        >
          ⤢ {t('expand')}
        </button>
      </div>
      <p className="text-xs text-on-surface-variant">
        {t('hint')}
      </p>

      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setExpanded(false)}
          role="dialog"
          aria-modal="true"
          aria-label={t('expandedLabel')}
        >
          <div
            className="relative z-0 h-[85vh] w-full max-w-5xl overflow-hidden bg-surface-container-lowest"
            onClick={(e) => e.stopPropagation()}
          >
            <PickerMap
              lat={lat}
              lng={lng}
              onChange={onChange}
              onPlace={onPlace}
              className="h-full w-full"
            />
            {/* autoFocus: focus moves into the dialog when it opens. */}
            <button
              type="button"
              autoFocus
              onClick={() => setExpanded(false)}
              className="absolute right-3 top-3 z-[1001] border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-sm font-medium text-on-surface-variant shadow-aceternity hover:text-primary"
            >
              ✕ {t('close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Read-only map with the listing's pin (listing detail).
// Lower zoom for approximate locations (geocoded from the address);
// className enables the enlarged variant (full-screen modal).
export function MapView({
  lat,
  lng,
  zoom = PIN_ZOOM,
  className = 'h-56 border border-outline-variant',
}: {
  lat: number;
  lng: number;
  zoom?: number;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = createMap(containerRef.current, [lat, lng], zoom);
    mapRef.current = map;
    L.marker([lat, lng], { icon: pinIcon }).addTo(map);
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lng, zoom]);

  return <div ref={containerRef} className={`w-full ${className}`} />;
}
