-- Clics en las tarjetas de "Sitios de interés" (empresas del Grupo CorpSC en
-- la home). Métrica anónima del panel admin: solo qué sitio se abrió y cuándo.
CREATE TABLE "SiteClick" (
    "id" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteClick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SiteClick_createdAt_idx" ON "SiteClick"("createdAt");

-- CreateIndex
CREATE INDEX "SiteClick_company_idx" ON "SiteClick"("company");
