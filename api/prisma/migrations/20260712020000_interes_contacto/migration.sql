-- El interés ahora se registra al abrir el detalle del anuncio; "contacto"
-- marca cuándo además pulsó Chatear/Llamar (dispara el aviso al dueño).
-- Los intereses existentes nacieron de un contacto: se conservan como tales.
ALTER TABLE "Interes" ADD COLUMN "contacto" BOOLEAN NOT NULL DEFAULT false;
UPDATE "Interes" SET "contacto" = true;
