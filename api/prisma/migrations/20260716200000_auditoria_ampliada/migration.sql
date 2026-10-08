-- Auditoría ampliada: nuevos tipos de evento, resultado de la operación y
-- contexto del request (IP, user-agent, recurso afectado) en cada traza.

ALTER TYPE "TraceType" ADD VALUE 'LOGOUT';
ALTER TYPE "TraceType" ADD VALUE 'AD_UPDATED';
ALTER TYPE "TraceType" ADD VALUE 'AD_VIEWED';
ALTER TYPE "TraceType" ADD VALUE 'AD_IMPORTED';
ALTER TYPE "TraceType" ADD VALUE 'REPORT_CREATED';
ALTER TYPE "TraceType" ADD VALUE 'REVIEW_CREATED';
ALTER TYPE "TraceType" ADD VALUE 'REVIEW_DELETED';

CREATE TYPE "TraceResult" AS ENUM ('OK', 'ERROR');

ALTER TABLE "Trace"
  ADD COLUMN "ip" TEXT,
  ADD COLUMN "userAgent" TEXT,
  ADD COLUMN "resource" TEXT,
  ADD COLUMN "result" "TraceResult" NOT NULL DEFAULT 'OK';

CREATE INDEX "Trace_actorEmail_idx" ON "Trace"("actorEmail");
