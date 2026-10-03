-- Reseña por anuncio (antes por empleador): se añade la referencia al
-- anuncio y la restricción única pasa a (autorId, anuncioId).
ALTER TABLE "Review" ADD COLUMN "anuncioId" TEXT;

-- Backfill: cada reseña existente se asocia al anuncio más reciente del
-- empleador reseñado; si el empleador ya no tiene anuncios, se descarta
-- (no hay anuncio al que pertenezca).
UPDATE "Review" r
SET "anuncioId" = (
  SELECT a."id"
  FROM "Anuncio" a
  WHERE a."createdById" = r."empleadorId"
  ORDER BY a."createdAt" DESC
  LIMIT 1
);

DELETE FROM "Review" WHERE "anuncioId" IS NULL;

ALTER TABLE "Review" ALTER COLUMN "anuncioId" SET NOT NULL;

ALTER TABLE "Review"
  ADD CONSTRAINT "Review_anuncioId_fkey"
  FOREIGN KEY ("anuncioId") REFERENCES "Anuncio"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

DROP INDEX "Review_autorId_empleadorId_key";

CREATE UNIQUE INDEX "Review_autorId_anuncioId_key" ON "Review"("autorId", "anuncioId");
