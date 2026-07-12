-- CreateEnum
CREATE TYPE "TraceType" AS ENUM ('LOGIN', 'REGISTER', 'EMAIL_VERIFIED', 'ADMIN_CREATED', 'ROLE_UPDATED', 'USER_DELETED', 'AD_CREATED', 'AD_UNPUBLISHED', 'AD_REPUBLISHED', 'AD_DELETED', 'REPORT_RESOLVED');

-- CreateTable
CREATE TABLE "Visit" (
    "id" TEXT NOT NULL,
    "adId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trace" (
    "id" TEXT NOT NULL,
    "type" "TraceType" NOT NULL,
    "description" TEXT NOT NULL,
    "actorId" TEXT,
    "actorEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trace_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Visit_createdAt_idx" ON "Visit"("createdAt");

-- CreateIndex
CREATE INDEX "Visit_adId_idx" ON "Visit"("adId");

-- CreateIndex
CREATE INDEX "Trace_createdAt_idx" ON "Trace"("createdAt");

-- CreateIndex
CREATE INDEX "Trace_type_idx" ON "Trace"("type");

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_adId_fkey" FOREIGN KEY ("adId") REFERENCES "Anuncio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

