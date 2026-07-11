-- Modelo de usuario único: desaparecen los roles de negocio
-- (TRABAJADOR/EMPLEADOR); queda un booleano esAdmin para el panel de
-- administración. Ningún usuario se elimina ni pierde datos.
ALTER TABLE "User" ADD COLUMN "esAdmin" BOOLEAN NOT NULL DEFAULT false;
UPDATE "User" SET "esAdmin" = true WHERE "role" = 'ADMIN';
ALTER TABLE "User" DROP COLUMN "role";
DROP TYPE "Role";

-- La reseña califica al dueño del anuncio (el concepto "empleador" deja
-- de existir). Solo se renombra: no hay pérdida de datos.
ALTER TABLE "Review" RENAME COLUMN "empleadorId" TO "duenoId";
ALTER TABLE "Review" RENAME CONSTRAINT "Review_empleadorId_fkey" TO "Review_duenoId_fkey";

-- Interés de un usuario en un anuncio (se registra al contactar).
CREATE TABLE "Interes" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "anuncioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Interes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Interes_usuarioId_anuncioId_key" ON "Interes"("usuarioId", "anuncioId");
CREATE INDEX "Interes_anuncioId_idx" ON "Interes"("anuncioId");

ALTER TABLE "Interes" ADD CONSTRAINT "Interes_usuarioId_fkey"
  FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Interes" ADD CONSTRAINT "Interes_anuncioId_fkey"
  FOREIGN KEY ("anuncioId") REFERENCES "Anuncio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
