-- CreateTable
CREATE TABLE "AlertaEmpleo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "departamento" "Departamento",
    "categoria" "Categoria",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertaEmpleo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AlertaEmpleo_departamento_categoria_idx" ON "AlertaEmpleo"("departamento", "categoria");

-- CreateIndex
CREATE INDEX "AlertaEmpleo_userId_idx" ON "AlertaEmpleo"("userId");

-- AddForeignKey
ALTER TABLE "AlertaEmpleo" ADD CONSTRAINT "AlertaEmpleo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
