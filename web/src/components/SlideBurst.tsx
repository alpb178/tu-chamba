'use client';

import { useEffect, useMemo, useState } from 'react';

// Ráfaga de destellos de un solo disparo que se reproduce sobre el carrusel
// cada vez que cambia el slide (equivalente ligero, sin dependencias, al de
// Iris Natural). Las partículas suben, se dispersan y desaparecen por CSS. No
// captura clics y se desactiva si el usuario prefiere movimiento reducido.
//
// Se renderiza SOLO en el cliente (tras montar): las posiciones son aleatorias
// (Math.random) y pintarlas en el servidor provocaría un desajuste de
// hidratación. En el primer render (servidor y cliente) devuelve null.
export function SlideBurst({
  trigger,
  color = '#004AC6',
}: {
  trigger: number;
  color?: string;
}) {
  // false hasta montar en el cliente (y respetando prefers-reduced-motion),
  // así el primer render coincide con el del servidor (ambos null).
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );
  }, []);

  // Posiciones/trayectorias nuevas en cada ráfaga (depende de `trigger`).
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
    [trigger],
  );

  // Sin ráfaga en el estado inicial ni en SSR / antes de montar.
  if (!ready || trigger === 0) return null;

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
