-- Datos que traen las ofertas importadas de prensa y que el modelo no admitía:
--   * varios teléfonos de contacto (dos o tres números por aviso),
--   * salario expresado como rango ("3500-4500"),
--   * referencia de ubicación en texto libre (no se filtra, solo se muestra),
--   * rubros y jornadas que faltaban en los enums.
-- Todo es retrocompatible: las columnas nuevas quedan NULL (o array vacío) en
-- los anuncios existentes y los valores nuevos de enum no cambian los guardados.

ALTER TABLE "Anuncio" ADD COLUMN "salarioMax" DECIMAL(12,2);
ALTER TABLE "Anuncio" ADD COLUMN "telefonosExtra" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Anuncio" ADD COLUMN "referenciaUbicacion" TEXT;

-- Rubros presentes en el mercado que caían en OTRO.
ALTER TYPE "Categoria" ADD VALUE IF NOT EXISTS 'AGROPECUARIA';
ALTER TYPE "Categoria" ADD VALUE IF NOT EXISTS 'MECANICA';
ALTER TYPE "Categoria" ADD VALUE IF NOT EXISTS 'MARKETING_DISENO';

-- Jornadas reales de las ofertas; A_CONVENIR evita inventar TIEMPO_COMPLETO
-- cuando el aviso no declara jornada.
ALTER TYPE "TipoJornada" ADD VALUE IF NOT EXISTS 'POR_CONTRATO';
ALTER TYPE "TipoJornada" ADD VALUE IF NOT EXISTS 'PASANTIA';
ALTER TYPE "TipoJornada" ADD VALUE IF NOT EXISTS 'FREELANCE';
ALTER TYPE "TipoJornada" ADD VALUE IF NOT EXISTS 'A_CONVENIR';
