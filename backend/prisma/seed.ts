import { Categoria, Departamento, PrismaClient, Role, TipoJornada } from '@prisma/client';
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
      nombre: 'Administrador',
      telefono: '70000000',
      role: Role.ADMIN,
      emailVerified: true,
    },
  });

  const empleador = await prisma.user.upsert({
    where: { email: 'empleador@tuchamba.com' },
    update: {},
    create: {
      email: 'empleador@tuchamba.com',
      password: passwordHash,
      nombre: 'Empresa Demo',
      telefono: '71111111',
      role: Role.EMPLEADOR,
      emailVerified: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'trabajador@tuchamba.com' },
    update: {},
    create: {
      email: 'trabajador@tuchamba.com',
      password: passwordHash,
      nombre: 'Juan Trabajador',
      telefono: '72222222',
      role: Role.TRABAJADOR,
      emailVerified: true,
    },
  });

  // Anuncios de ejemplo (uno por cada tipo de jornada)
  const count = await prisma.anuncio.count();
  if (count === 0) {
    const expiraEn = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    await prisma.anuncio.createMany({
      data: [
        {
          descripcion:
            'Se busca ayudante de albañilería para obra en zona norte. Pago por día.',
          requisitos: 'Experiencia básica en obra. Puntualidad.',
          ubicacion: 'Santa Cruz, zona norte',
          departamento: Departamento.SANTA_CRUZ,
          categoria: Categoria.CONSTRUCCION,
          salario: 150.0,
          telefono: '71111111',
          tipoJornada: TipoJornada.DIARIA,
          expiraEn,
          createdById: empleador.id,
        },
        {
          descripcion:
            'Vacante para vendedor/a de tienda. Atención al cliente, manejo de caja.',
          requisitos: 'Experiencia en ventas de al menos 6 meses.',
          ubicacion: 'La Paz, centro',
          departamento: Departamento.LA_PAZ,
          categoria: Categoria.VENTAS,
          horario: 'Lun-Sab 9:00 a 18:00',
          salario: 2500.0,
          telefono: '71111111',
          tipoJornada: TipoJornada.TIEMPO_COMPLETO,
          expiraEn,
          createdById: empleador.id,
        },
        {
          descripcion:
            'Recepcionista para turno tarde, medio tiempo. Buena presencia.',
          ubicacion: 'Cochabamba, zona sur',
          departamento: Departamento.COCHABAMBA,
          categoria: Categoria.ADMINISTRACION,
          horario: 'Lun-Vie 14:00 a 18:00',
          salario: 1500.0,
          telefono: '71111111',
          tipoJornada: TipoJornada.MEDIA_JORNADA,
          expiraEn,
          createdById: empleador.id,
        },
      ],
    });
  }

  console.log('Seed completado.');
  console.log('Usuarios (password de todos: Password123):');
  console.log('  admin@tuchamba.com       (ADMIN)');
  console.log('  empleador@tuchamba.com   (EMPLEADOR)');
  console.log('  trabajador@tuchamba.com  (TRABAJADOR)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
