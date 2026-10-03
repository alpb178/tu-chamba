-- Actividad del Sitio: duración de la operación en las trazas y registro
-- persistente de errores del sistema con severidad y estado.

ALTER TABLE "Trace" ADD COLUMN "durationMs" INTEGER;

CREATE TYPE "ErrorSeverity" AS ENUM ('WARNING', 'ERROR', 'CRITICAL');
CREATE TYPE "ErrorStatus" AS ENUM ('NEW', 'RESOLVED');

CREATE TABLE "ErrorLog" (
    "id" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "path" TEXT,
    "severity" "ErrorSeverity" NOT NULL DEFAULT 'ERROR',
    "status" "ErrorStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ErrorLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ErrorLog_createdAt_idx" ON "ErrorLog"("createdAt");
CREATE INDEX "ErrorLog_status_idx" ON "ErrorLog"("status");
