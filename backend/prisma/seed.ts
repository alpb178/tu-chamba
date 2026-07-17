import { Category, Department, JobType, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

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

  const empleador = await prisma.user.upsert({
    where: { email: 'empleador@tuchamba.com' },
    update: {},
    create: {
      email: 'empleador@tuchamba.com',
      password: passwordHash,
      name: 'Empresa Demo',
      phone: '71111111',
      emailVerified: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'trabajador@tuchamba.com' },
    update: {},
    create: {
      email: 'trabajador@tuchamba.com',
      password: passwordHash,
      name: 'Juan Trabajador',
      phone: '72222222',
      emailVerified: true,
    },
  });

  // Anuncios de ejemplo (uno por cada tipo de jornada)
  const count = await prisma.ad.count();
  if (count === 0) {
    const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    await prisma.ad.createMany({
      data: [
        {
          title: 'Ayudante de albañilería',
          description:
            'Se busca ayudante de albañilería para obra en zona norte. Pago por día.',
          requirements: 'Experiencia básica en obra. Puntualidad.',
          location: 'Santa Cruz, zona norte',
          department: Department.SANTA_CRUZ,
          category: Category.CONSTRUCCION,
          salary: 150.0,
          phone: '71111111',
          jobType: JobType.DIARIA,
          expiresAt,
          createdById: empleador.id,
        },
        {
          title: 'Vendedor/a de tienda',
          description:
            'Vacante para vendedor/a de tienda. Atención al cliente, manejo de caja.',
          requirements: 'Experiencia en ventas de al menos 6 meses.',
          location: 'La Paz, centro',
          department: Department.LA_PAZ,
          category: Category.VENTAS,
          schedule: 'Lun-Sab 9:00 a 18:00',
          salary: 2500.0,
          phone: '71111111',
          jobType: JobType.TIEMPO_COMPLETO,
          expiresAt,
          createdById: empleador.id,
        },
        {
          title: 'Recepcionista turno tarde',
          description:
            'Recepcionista para turno tarde, medio tiempo. Buena presencia.',
          location: 'Cochabamba, zona sur',
          department: Department.COCHABAMBA,
          category: Category.ADMINISTRACION,
          schedule: 'Lun-Vie 14:00 a 18:00',
          salary: 1500.0,
          phone: '71111111',
          jobType: JobType.MEDIA_JORNADA,
          expiresAt,
          createdById: empleador.id,
        },
      ],
    });
  }

  console.log('Seed completado.');
  console.log('Usuarios (password de todos: Password123):');
  console.log('  admin@tuchamba.com       (admin)');
  console.log('  empleador@tuchamba.com');
  console.log('  trabajador@tuchamba.com');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
