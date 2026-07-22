'use client';

import { cn } from '@/lib/cn';
import { useEffect, useRef } from 'react';
import styles from './Beam.module.css';

/**
 * Meteoro decorativo que cruza un contenedor con un rastro en degradado y se
 * reinicia con parámetros aleatorios. Portado de Iris Natural. El contenedor
 * padre debe ser `relative` y recortar el desbordamiento.
 */
const Beam = ({
  showBeam = true,
  className,
}: {
  showBeam?: boolean;
  className?: string;
}) => {
  const meteorRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const meteor = meteorRef.current;

    if (showBeam && meteor) {
      const handleAnimationEnd = () => {
        meteor.style.visibility = 'hidden';
        const animationDelay = Math.floor(Math.random() * (2 - 0) + 0);
        const animationDuration = Math.floor(Math.random() * (4 - 0) + 0);
        const meteorWidth = Math.floor(Math.random() * (150 - 80) + 80);
        meteor.style.setProperty('--meteor-delay', `${animationDelay}s`);
        meteor.style.setProperty('--meteor-duration', `${animationDuration}s`);
        meteor.style.setProperty('--meteor-width', `${meteorWidth}px`);

        restartAnimation();
      };

      const handleAnimationStart = () => {
        meteor.style.visibility = 'visible';
      };

      meteor.addEventListener('animationend', handleAnimationEnd);
      meteor.addEventListener('animationstart', handleAnimationStart);

      return () => {
        meteor.removeEventListener('animationend', handleAnimationEnd);
        meteor.removeEventListener('animationstart', handleAnimationStart);
      };
    }
  }, [showBeam]);

  const restartAnimation = () => {
    const meteor = meteorRef.current;
    if (!meteor) return;
    meteor.style.animation = 'none';
    void meteor.offsetWidth; // fuerza un reflow para reiniciar la animación
    meteor.style.animation = '';
  };

  if (!showBeam) return null;

  return (
    <span
      ref={meteorRef}
      className={cn(
        '-top-4 absolute z-[40] h-[0.1rem] w-[0.1rem] rotate-[180deg] rounded-full bg-primary shadow-[0_0_0_1px_#ffffff10]',
        styles.meteor,
        className
      )}
    />
  );
};

export default Beam;
