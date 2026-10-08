-- Limpieza de anuncios vencidos: los anuncios se eliminan al expirar
-- (job horario), así que:
--
-- 1) Las reseñas se desvinculan del anuncio en lugar de borrarse en cascada
--    (la calificación global del dueño se conserva).
ALTER TABLE "Review" ALTER COLUMN "anuncioId" DROP NOT NULL;

ALTER TABLE "Review" DROP CONSTRAINT "Review_anuncioId_fkey";
ALTER TABLE "Review"
  ADD CONSTRAINT "Review_anuncioId_fkey"
  FOREIGN KEY ("anuncioId") REFERENCES "Anuncio"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- 2) El flag de "vencimiento notificado" sobra: la notificación se crea en el
--    momento de eliminar el anuncio, no de forma diferida.
ALTER TABLE "Anuncio" DROP COLUMN "vencimientoNotificado";
