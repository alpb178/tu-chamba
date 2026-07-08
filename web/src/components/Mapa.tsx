'use client';

// Mapa Leaflet + OpenStreetMap. Este módulo toca `window` al cargar Leaflet,
// así que impórtalo siempre con next/dynamic y ssr: false.

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Centro por defecto: Santa Cruz de la Sierra.
const DEFAULT_CENTER: [number, number] = [-17.7833, -63.1821];
const DEFAULT_ZOOM = 12;
const PIN_ZOOM = 15;

// divIcon evita los problemas de bundling de los assets de icono de Leaflet.
const pinIcon = L.divIcon({
  className: '',
  html: '<span style="font-size:30px;line-height:30px;filter:drop-shadow(0 1px 1px rgba(0,0,0,.4))">📍</span>',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

function crearMapa(el: HTMLElement, center: [number, number], zoom: number) {
  const map = L.map(el).setView(center, zoom);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap',
  }).addTo(map);
  return map;
}

// Nombre legible del lugar (best effort, para precargar el campo de texto).
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
    const partes = [
      a.suburb ?? a.neighbourhood ?? a.road,
      a.city ?? a.town ?? a.village ?? a.state,
    ].filter(Boolean);
    return partes.length ? partes.join(', ') : (data.display_name ?? null);
  } catch {
    return null;
  }
}

// Selector de ubicación: clic o arrastre del pin. Reporta lat/lng y,
// si se puede resolver, un nombre legible del lugar.
export function MapPicker({
  lat,
  lng,
  onChange,
  onPlace,
}: {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
  onPlace?: (nombre: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Callbacks en refs para no re-crear el mapa cuando cambien.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onPlaceRef = useRef(onPlace);
  onPlaceRef.current = onPlace;

  function ponerPin(map: L.Map, punto: L.LatLng) {
    if (!markerRef.current) {
      markerRef.current = L.marker(punto, { icon: pinIcon, draggable: true })
        .addTo(map)
        .on('dragend', () => {
          const p = markerRef.current!.getLatLng();
          notificar(p);
        });
    } else {
      markerRef.current.setLatLng(punto);
    }
  }

  function notificar(p: L.LatLng) {
    onChangeRef.current(p.lat, p.lng);
    if (onPlaceRef.current) {
      reverseGeocode(p.lat, p.lng).then(
        (nombre) => nombre && onPlaceRef.current?.(nombre),
      );
    }
  }

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const tienePin = lat != null && lng != null;
    const center: [number, number] = tienePin ? [lat!, lng!] : DEFAULT_CENTER;
    const map = crearMapa(containerRef.current, center, tienePin ? PIN_ZOOM : DEFAULT_ZOOM);
    mapRef.current = map;

    if (tienePin) ponerPin(map, L.latLng(lat!, lng!));

    map.on('click', (e: L.LeafletMouseEvent) => {
      ponerPin(map, e.latlng);
      notificar(e.latlng);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Solo inicialización: el pin posterior lo mueve el usuario.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function usarMiUbicacion() {
    navigator.geolocation?.getCurrentPosition((pos) => {
      const punto = L.latLng(pos.coords.latitude, pos.coords.longitude);
      const map = mapRef.current;
      if (!map) return;
      map.setView(punto, PIN_ZOOM);
      ponerPin(map, punto);
      notificar(punto);
    });
  }

  return (
    <div className="space-y-1">
      <div
        ref={containerRef}
        className="h-64 w-full rounded-md border border-gray-300"
      />
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          Haz clic en el mapa o arrastra el pin para marcar el lugar de trabajo.
        </p>
        <button
          type="button"
          onClick={usarMiUbicacion}
          className="text-xs text-brand underline hover:text-brand-dark"
        >
          Usar mi ubicación
        </button>
      </div>
    </div>
  );
}

// Mapa de solo lectura con el pin de la oferta (detalle del anuncio).
export function MapView({ lat, lng }: { lat: number; lng: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = crearMapa(containerRef.current, [lat, lng], PIN_ZOOM);
    mapRef.current = map;
    L.marker([lat, lng], { icon: pinIcon }).addTo(map);
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lng]);

  return (
    <div
      ref={containerRef}
      className="h-56 w-full rounded-md border border-gray-200"
    />
  );
}
