-- CreateEnum
CREATE TYPE "EstadoAnuncio" AS ENUM ('ACTIVO', 'DADO_DE_BAJA');

-- CreateEnum
CREATE TYPE "MotivoReporte" AS ENUM ('SPAM', 'FRAUDE', 'CONTENIDO_INAPROPIADO', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoReporte" AS ENUM ('PENDIENTE', 'ATENDIDO', 'DESCARTADO');

-- AlterTable (expiraEn se agrega nullable, se backfillea y luego se exige NOT NULL)
ALTER TABLE "Anuncio" ADD COLUMN     "duracionDias" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "estado" "EstadoAnuncio" NOT NULL DEFAULT 'ACTIVO',
ADD COLUMN     "expiraEn" TIMESTAMP(3),
ADD COLUMN     "horario" TEXT,
ADD COLUMN     "requisitos" TEXT,
ADD COLUMN     "ubicacion" TEXT;

-- Backfill: los anuncios existentes vencen 3 días después de su creación.
UPDATE "Anuncio" SET "expiraEn" = "createdAt" + INTERVAL '3 days' WHERE "expiraEn" IS NULL;

ALTER TABLE "Anuncio" ALTER COLUMN "expiraEn" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "googleId" TEXT,
ALTER COLUMN "password" DROP NOT NULL,
ALTER COLUMN "telefono" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comentario" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "empleadorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reporte" (
    "id" TEXT NOT NULL,
    "motivo" "MotivoReporte" NOT NULL,
    "comentario" TEXT,
    "estado" "EstadoReporte" NOT NULL DEFAULT 'PENDIENTE',
    "anuncioId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reporte_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Review_autorId_empleadorId_key" ON "Review"("autorId", "empleadorId");

-- CreateIndex
CREATE UNIQUE INDEX "Reporte_anuncioId_reporterId_key" ON "Reporte"("anuncioId", "reporterId");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_empleadorId_fkey" FOREIGN KEY ("empleadorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reporte" ADD CONSTRAINT "Reporte_anuncioId_fkey" FOREIGN KEY ("anuncioId") REFERENCES "Anuncio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reporte" ADD CONSTRAINT "Reporte_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
