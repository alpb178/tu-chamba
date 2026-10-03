import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

// Minimal seed: creates (or leaves unchanged) ONLY the admin user.
// Usage: DATABASE_URL="<production-url>" npx ts-node prisma/seed-admin.ts
const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@tuchamba.com' },
    update: {},
    create: {
      email: 'admin@tuchamba.com',
      password: passwordHash,
      name: 'Administrador',
      phone: '70000000',
      isAdmin: true,
      emailVerified: true,
    },
  });

  console.log('Admin listo:', { id: admin.id, email: admin.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
