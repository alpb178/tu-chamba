-- CreateEnum
CREATE TYPE "TipoNotificacion" AS ENUM ('CHAT_INICIADO', 'NUEVA_REVIEW', 'ANUNCIO_VENCIDO', 'NUEVO_ANUNCIO');

-- AlterTable: evita duplicar la notificación de vencimiento por anuncio.
ALTER TABLE "Anuncio" ADD COLUMN "vencimientoNotificado" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Notificacion" (
    "id" TEXT NOT NULL,
    "tipo" "TipoNotificacion" NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "anuncioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notificacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notificacion_userId_leida_idx" ON "Notificacion"("userId", "leida");

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_anuncioId_fkey" FOREIGN KEY ("anuncioId") REFERENCES "Anuncio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
