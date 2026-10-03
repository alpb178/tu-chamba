-- Prioridad manual del panel: permite fijar un anuncio arriba del listado
-- (mayor prioridad = más arriba) sin depender de los criterios de relevancia.
-- Retrocompatible: los anuncios existentes quedan en 0 (orden normal).

ALTER TABLE "Anuncio" ADD COLUMN "prioridad" INTEGER NOT NULL DEFAULT 0;
