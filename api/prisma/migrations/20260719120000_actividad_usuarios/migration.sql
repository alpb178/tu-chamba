-- Actividad de usuarios registrados: las páginas vistas guardan el usuario
-- cuando la visita llega con sesión iniciada (última visita y tiempo de
-- estancia del panel admin). Sin FK a propósito: la métrica sobrevive al
-- borrado del usuario.
ALTER TABLE "PageView" ADD COLUMN "userId" TEXT;

CREATE INDEX "PageView_userId_createdAt_idx" ON "PageView"("userId", "createdAt");

-- Nuevos eventos de auditoría para las acciones de actualizar/eliminar
-- registros desde el panel admin.
ALTER TYPE "TraceType" ADD VALUE 'REPORT_DELETED';
ALTER TYPE "TraceType" ADD VALUE 'REVIEW_UPDATED';
ALTER TYPE "TraceType" ADD VALUE 'USER_UPDATED';
ALTER TYPE "TraceType" ADD VALUE 'TRACE_DELETED';
