// Visual effects library in the "aceternity" language, ported from Iris
// Natural and adapted to tu-chamba's M3 tokens and `cn` helper.
// The heavy components (WebGL/particles) are "use client" and are best
// loaded with next/dynamic { ssr: false } where they are used.

export { Tilt3D } from './Tilt3D';
export { SlideBurst } from './SlideBurst';
export { default as Beam } from './Beam';
export { Cover, CircleIcon } from './Cover';
export { BlurImage } from './BlurImage';
export { SparklesCore } from './SparklesCore';
export { default as StarBackground } from './StarBackground';
export { default as ShootingStars } from './ShootingStars';
export { AmbientColor } from './AmbientColor';
export { AnimatedTooltip } from './AnimatedTooltip';
export type { TooltipItem } from './AnimatedTooltip';
export { World, Globe } from './Globe';
export { CanvasRevealEffect } from './CanvasRevealEffect';
