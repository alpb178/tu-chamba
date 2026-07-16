-- El salario pasa a ser opcional: la importación por CSV permite ofertas
-- sin salario (queda vacío, "a convenir"), en lugar de asignar un valor.
ALTER TABLE "Anuncio" ALTER COLUMN "salario" DROP NOT NULL;
