// Hero de la portada (variante "banner"): muestra el banner de marca de Tu
// Chamba a sangre completa y sin recortar. El buscador de empleos vive en el
// encabezado del listado (CatalogHeader), igual que en la variante editorial.
export function Hero() {
  return (
    <section className="relative z-30 -mt-6 ml-[calc(50%-50vw)] w-screen">
      {/* Banner a todo el ancho, completo (tiene texto hasta el borde). h-auto
          conserva su proporción; width/height reservan el espacio para evitar
          saltos de layout (sin CLS). */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/banner.jpeg"
        alt="Ofrece o busca trabajo — conexión directa, sin CV"
        width={1936}
        height={544}
        className="h-auto w-full"
        fetchPriority="high"
      />
    </section>
  );
}
