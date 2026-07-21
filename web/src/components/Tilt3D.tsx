'use client';

import { useEffect, useRef, useState } from 'react';

// Envoltorio con inclinación 3D al mover el cursor (perspectiva + rotateX/Y) y
// una aparición suave (fade + subida) la primera vez que entra en pantalla.
// Sin dependencias: transform en línea y transiciones CSS. En táctil el tilt
// no molesta (se dispara con el ratón) y respeta prefers-reduced-motion.
export function Tilt3D({
  children,
  className = '',
  // Inclinación máxima en grados.
  max = 9,
  // Escala al pasar el cursor.
  scale = 1.03,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
  scale?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useRef(false);
  const [revealed, setRevealed] = useState(false);
  const [rx, setRx] = useState(0);
  const [ry, setRy] = useState(0);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    reduced.current = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    const el = ref.current;
    if (!el || reduced.current) {
      setRevealed(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setRevealed(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduced.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setRx(-py * 2 * max);
    setRy(px * 2 * max);
  };

  const reset = () => {
    setHover(false);
    setRx(0);
    setRy(0);
  };

  return (
    <div
      ref={ref}
      className={`h-full transition-[opacity,transform] duration-500 ease-out ${
        revealed ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      } ${className}`}
    >
      <div
        onMouseEnter={() => setHover(true)}
        onMouseMove={onMove}
        onMouseLeave={reset}
        style={{
          transform: `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${
            hover ? scale : 1
          })`,
          transformStyle: 'preserve-3d',
          transition: 'transform 150ms ease-out',
        }}
        className="h-full"
      >
        {children}
      </div>
    </div>
  );
}
