'use client';

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';
import { cn } from '@/lib/cn';

/**
 * Wrapper with a 3D tilt that follows the cursor (perspective + rotateX/Y),
 * smoothed with springs. On touch it doesn't apply (no hover) and stays out
 * of the way. Ported from the Iris Natural design system.
 */
export function Tilt3D({
  children,
  className,
  max = 9,
  scale = 1.03,
}: {
  children: React.ReactNode;
  className?: string;
  /** Maximum tilt in degrees. */
  max?: number;
  /** Scale on hover. */
  scale?: number;
}) {
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [max, -max]), {
    stiffness: 220,
    damping: 18,
  });
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-max, max]), {
    stiffness: 220,
    damping: 18,
  });

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };
  const reset = () => {
    px.set(0);
    py.set(0);
  };

  return (
    <motion.div
      onMouseMove={onMove}
      onMouseLeave={reset}
      whileHover={{ scale }}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      className={cn('h-full [transform-style:preserve-3d]', className)}
    >
      {children}
    </motion.div>
  );
}
