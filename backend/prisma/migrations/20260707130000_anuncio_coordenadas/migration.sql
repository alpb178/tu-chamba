-- Coordenadas del pin de ubicación elegido en el mapa (opcional).
ALTER TABLE "Anuncio" ADD COLUMN "latitud" DOUBLE PRECISION,
ADD COLUMN "longitud" DOUBLE PRECISION;
