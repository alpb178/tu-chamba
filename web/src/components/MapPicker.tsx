'use client';

// Mapa Leaflet + OpenStreetMap. Este módulo toca `window` al cargar Leaflet,
// así que impórtalo siempre con next/dynamic y ssr: false.

import { useEffect, useRef, useState } from 'react';
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

function createMap(el: HTMLElement, center: [number, number], zoom: number) {
  const map = L.map(el).setView(center, zoom);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap',
  }).addTo(map);
  // El contenedor puede terminar de medirse después del init (p. ej. al
  // montarse dentro del modal): recalcula el tamaño en el siguiente tick.
  setTimeout(() => map.invalidateSize(), 0);
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
    const parts = [
      a.suburb ?? a.neighbourhood ?? a.road,
      a.city ?? a.town ?? a.village ?? a.state,
    ].filter(Boolean);
    return parts.length ? parts.join(', ') : (data.display_name ?? null);
  } catch {
    return null;
  }
}

// Lienzo del selector: clic o arrastre del pin, botón "mi ubicación" y
// sincronización con las props (así el mapa chico refleja lo elegido en el
// ampliado y viceversa). Lo montan MapPicker y su modal a distinto tamaño.
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
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Callbacks en refs para no re-crear el mapa cuando cambien.
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
    // Solo inicialización: los cambios posteriores llegan por el efecto de abajo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pin movido desde otra instancia (modal ↔ mapa chico): sincroniza.
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
        className="absolute bottom-2 left-2 z-[1001] rounded-md border border-outline-variant bg-surface-container-lowest/95 px-2 py-1 text-xs font-medium text-on-surface-variant shadow-sm hover:text-primary"
      >
        📍 Usar mi ubicación
      </button>
    </div>
  );
}

// Selector de ubicación con vista ampliable (modal), como en el detalle.
// Los panes de Leaflet usan z-index altos: el wrapper `relative z-0` los
// encierra en su propio stacking context para que no tapen el modal.
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
  const [expanded, setExpanded] = useState(false);

  // Cerrar el modal con Escape.
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
          className="h-64 w-full rounded-md border border-outline-variant"
        />
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="absolute right-2 top-2 z-[1001] rounded-md border border-outline-variant bg-surface-container-lowest/95 px-2 py-1 text-xs font-medium text-on-surface-variant shadow-sm hover:text-primary"
        >
          ⤢ Ampliar
        </button>
      </div>
      <p className="text-xs text-on-surface-variant">
        Haz clic en el mapa o arrastra el pin para marcar el lugar de trabajo.
      </p>

      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setExpanded(false)}
          role="dialog"
          aria-label="Mapa ampliado"
        >
          <div
            className="relative z-0 h-[85vh] w-full max-w-5xl overflow-hidden rounded-lg bg-surface-container-lowest"
            onClick={(e) => e.stopPropagation()}
          >
            <PickerMap
              lat={lat}
              lng={lng}
              onChange={onChange}
              onPlace={onPlace}
              className="h-full w-full"
            />
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="absolute right-3 top-3 z-[1001] rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-sm font-medium text-on-surface-variant shadow hover:text-primary"
            >
              ✕ Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Mapa de solo lectura con el pin de la oferta (detalle del anuncio).
// zoom menor para ubicaciones aproximadas (geocodificadas por dirección);
// className permite la variante ampliada (modal a pantalla completa).
export function MapView({
  lat,
  lng,
  zoom = PIN_ZOOM,
  className = 'h-56 rounded-md border border-outline-variant',
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
