-- Título del anuncio (obligatorio). Para los anuncios existentes se toma la
-- primera oración de la descripción (hasta el primer punto o salto de línea),
-- con tope de 100 caracteres; si queda vacía, el inicio de la descripción.
ALTER TABLE "Anuncio" ADD COLUMN "titulo" TEXT;

UPDATE "Anuncio"
SET "titulo" = left(trim(split_part(replace("descripcion", E'\n', '.'), '.', 1)), 100);

UPDATE "Anuncio"
SET "titulo" = left(trim("descripcion"), 100)
WHERE "titulo" IS NULL OR "titulo" = '';

ALTER TABLE "Anuncio" ALTER COLUMN "titulo" SET NOT NULL;
