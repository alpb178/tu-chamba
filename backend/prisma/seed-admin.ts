import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

// Seed mínimo: crea (o deja igual) SOLO el usuario admin.
// Uso: DATABASE_URL="<url-de-produccion>" npx ts-node prisma/seed-admin.ts
const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@tuchamba.com' },
    update: {},
    create: {
      email: 'admin@tuchamba.com',
      password: passwordHash,
      nombre: 'Administrador',
      telefono: '70000000',
      role: Role.ADMIN,
    },
  });

  console.log('Admin listo:', { id: admin.id, email: admin.email, role: admin.role });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
