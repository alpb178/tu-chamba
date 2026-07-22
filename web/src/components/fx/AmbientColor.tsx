'use client';

/**
 * Luz ambiental fija: tres gradientes radiales rotados que tiñen sutilmente el
 * fondo. Portado de Iris Natural y adaptado a los tokens de marca de tu-chamba
 * (azul primario + ámbar + verde) sin dependencia del contexto de tema (el
 * sitio es siempre claro).
 */
export const AmbientColor = () => {
  const primaryOpacity = 0.05;
  const secondaryOpacity = 0.02;
  const tertiaryOpacity = 0.02;

  return (
    <div className="pointer-events-none absolute top-0 left-0 z-40 h-screen w-screen">
      <div
        style={{
          transform: 'translateY(-350px) rotate(-45deg)',
          width: '560px',
          height: '1380px',
          background: `radial-gradient(68.54% 68.72% at 55.02% 31.46%,
            rgb(var(--c-primary) / ${primaryOpacity}) 0,
            rgb(var(--c-secondary-container) / ${secondaryOpacity}) 50%,
            rgb(var(--c-secondary-container) / 0) 80%)`,
        }}
        className="absolute top-0 left-0"
      />

      <div
        style={{
          transform: 'rotate(-45deg) translate(5%, -50%)',
          transformOrigin: 'top left',
          width: '240px',
          height: '1380px',
          background: `radial-gradient(50% 50% at 50% 50%,
            rgb(var(--c-primary) / ${primaryOpacity * 0.75}) 0,
            rgb(var(--c-primary) / ${secondaryOpacity}) 80%,
            transparent 100%)`,
        }}
        className="absolute top-0 left-0"
      />

      <div
        style={{
          position: 'absolute',
          borderRadius: '20px',
          transform: 'rotate(-45deg) translate(-180%, -70%)',
          transformOrigin: 'top left',
          top: 0,
          left: 0,
          width: '240px',
          height: '1380px',
          background: `radial-gradient(50% 50% at 50% 50%,
            rgb(var(--c-primary) / ${primaryOpacity * 0.5}) 0,
            rgb(var(--c-tertiary-container) / ${tertiaryOpacity}) 80%,
            transparent 100%)`,
        }}
        className="absolute top-0 left-0"
      />
    </div>
  );
};
