// Librería de efectos visuales del lenguaje "aceternity", portada de Iris
// Natural y adaptada a los tokens M3 y al helper `cn` de tu-chamba.
// Los componentes pesados (WebGL/partículas) son "use client" y conviene
// cargarlos con next/dynamic { ssr: false } donde se usen.

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
