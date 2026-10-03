-- Token de un solo uso para restablecer la contraseña olvidada.
CREATE TABLE "TokenRestablecimiento" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TokenRestablecimiento_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TokenRestablecimiento_token_key" ON "TokenRestablecimiento"("token");
CREATE INDEX "TokenRestablecimiento_userId_idx" ON "TokenRestablecimiento"("userId");

ALTER TABLE "TokenRestablecimiento" ADD CONSTRAINT "TokenRestablecimiento_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
