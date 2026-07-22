-- País (ISO-2) y fuente/origen del request en la auditoría (panel de trazas).
-- country: resuelto por cabecera de CDN o geo-IP; source: utm_source o host
-- del Referer. Ambos opcionales y retrocompatibles (NULL en trazas previas).
ALTER TABLE "Trace" ADD COLUMN "country" TEXT;
ALTER TABLE "Trace" ADD COLUMN "source" TEXT;
