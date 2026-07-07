-- CreateEnum
CREATE TYPE "Departamento" AS ENUM ('LA_PAZ', 'SANTA_CRUZ', 'COCHABAMBA', 'ORURO', 'POTOSI', 'CHUQUISACA', 'TARIJA', 'BENI', 'PANDO');

-- CreateEnum
CREATE TYPE "Categoria" AS ENUM ('VENTAS', 'GASTRONOMIA', 'CONSTRUCCION', 'LIMPIEZA', 'CUIDADO_PERSONAS', 'TRANSPORTE', 'ADMINISTRACION', 'TECNOLOGIA', 'EDUCACION', 'SALUD', 'BELLEZA', 'SEGURIDAD', 'OTRO');

-- AlterTable
ALTER TABLE "Anuncio" ADD COLUMN "departamento" "Departamento",
ADD COLUMN "categoria" "Categoria";

-- Backfill best-effort del departamento a partir del texto de ubicación.
UPDATE "Anuncio" SET "departamento" = 'SANTA_CRUZ' WHERE "departamento" IS NULL AND "ubicacion" ILIKE '%santa cruz%';
UPDATE "Anuncio" SET "departamento" = 'LA_PAZ'     WHERE "departamento" IS NULL AND "ubicacion" ILIKE '%la paz%';
UPDATE "Anuncio" SET "departamento" = 'COCHABAMBA' WHERE "departamento" IS NULL AND "ubicacion" ILIKE '%cochabamba%';
UPDATE "Anuncio" SET "departamento" = 'ORURO'      WHERE "departamento" IS NULL AND "ubicacion" ILIKE '%oruro%';
UPDATE "Anuncio" SET "departamento" = 'POTOSI'     WHERE "departamento" IS NULL AND ("ubicacion" ILIKE '%potos%');
UPDATE "Anuncio" SET "departamento" = 'CHUQUISACA' WHERE "departamento" IS NULL AND ("ubicacion" ILIKE '%chuquisaca%' OR "ubicacion" ILIKE '%sucre%');
UPDATE "Anuncio" SET "departamento" = 'TARIJA'     WHERE "departamento" IS NULL AND "ubicacion" ILIKE '%tarija%';
UPDATE "Anuncio" SET "departamento" = 'BENI'       WHERE "departamento" IS NULL AND ("ubicacion" ILIKE '%beni%' OR "ubicacion" ILIKE '%trinidad%');
UPDATE "Anuncio" SET "departamento" = 'PANDO'      WHERE "departamento" IS NULL AND ("ubicacion" ILIKE '%pando%' OR "ubicacion" ILIKE '%cobija%');

-- CreateIndex (listado público filtra por estado + expiraEn; añadimos departamento/categoria a la búsqueda)
CREATE INDEX "Anuncio_departamento_idx" ON "Anuncio"("departamento");
CREATE INDEX "Anuncio_categoria_idx" ON "Anuncio"("categoria");
