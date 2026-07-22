'use client';

import { cn } from '@/lib/cn';
import type { ISourceOptions } from '@tsparticles/engine';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import { useEffect, useMemo, useState } from 'react';

// El engine de tsparticles es global; lo inicializamos una sola vez y
// compartimos la promesa entre montajes.
let enginePromise: Promise<void> | null = null;

/**
 * Ráfaga de destellos de un solo disparo que se reproduce sobre el carrusel
 * cada vez que cambia el slide. Se re-monta con `key={trigger}` para relanzar
 * la animación; las partículas tienen vida limitada (`life.count = 1`) así que
 * aparecen, se dispersan y desaparecen. No captura clics (`pointer-events-none`)
 * para no bloquear los botones de navegación, y se desactiva si el usuario
 * prefiere movimiento reducido. Portado de Iris Natural (color por defecto en
 * el azul de marca de tu-chamba).
 */
export const SlideBurst = ({
  trigger,
  color = '#004AC6',
  className,
}: {
  trigger: number;
  color?: string;
  className?: string;
}) => {
  const [init, setInit] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (!enginePromise) {
      enginePromise = initParticlesEngine(async (engine) => {
        await loadSlim(engine);
      });
    }
    enginePromise.then(() => setInit(true));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const options: ISourceOptions = useMemo(
    () => ({
      fullScreen: { enable: false },
      fpsLimit: 60,
      detectRetina: true,
      particles: {
        number: { value: 28 },
        color: { value: color },
        shape: { type: 'circle' },
        opacity: {
          value: { min: 0, max: 0.9 },
          animation: {
            enable: true,
            speed: 1.6,
            startValue: 'max',
            destroy: 'min',
            sync: false,
          },
        },
        size: { value: { min: 1, max: 4 } },
        move: {
          enable: true,
          speed: { min: 2, max: 7 },
          direction: 'none',
          outModes: { default: 'destroy' },
          decay: 0.06,
          gravity: { enable: true, acceleration: 6 },
        },
        life: {
          count: 1,
          duration: { value: { min: 0.7, max: 1.3 }, sync: false },
        },
      },
    }),
    [color]
  );

  if (!init || reducedMotion) return null;

  return (
    <Particles
      key={trigger}
      id={`slide-burst-${trigger}`}
      className={cn('pointer-events-none absolute inset-0 z-20', className)}
      options={options}
    />
  );
};
