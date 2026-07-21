'use client';

import { useMemo, useState, useEffect } from 'react';

// Ráfaga de destellos de un solo disparo que se reproduce sobre el carrusel
// cada vez que cambia el slide (equivalente ligero, sin dependencias, al de
// Iris Natural). Se re-monta con `key={trigger}` para relanzar la animación;
// las partículas suben, se dispersan y desaparecen por CSS. No captura clics y
// se desactiva si el usuario prefiere movimiento reducido.
export function SlideBurst({
  trigger,
  color = '#004AC6',
}: {
  trigger: number;
  color?: string;
}) {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    setReduced(
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );
  }, []);

  // Posiciones y trayectorias fijas durante la vida de la ráfaga.
  const particles = useMemo(
    () =>
      Array.from({ length: 60 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        dx: (Math.random() - 0.5) * 90,
        dy: -30 - Math.random() * 80,
        size: 2 + Math.random() * 4,
        duration: 700 + Math.random() * 700,
        delay: Math.random() * 180,
      })),
    [],
  );

  if (reduced) return null;

  return (
    <div
      key={trigger}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
    >
      {particles.map((p, i) => (
        <span
          key={i}
          className="slide-burst-particle absolute rounded-full"
          style={
            {
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: color,
              animationDuration: `${p.duration}ms`,
              animationDelay: `${p.delay}ms`,
              '--burst-dx': `${p.dx}px`,
              '--burst-dy': `${p.dy}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
