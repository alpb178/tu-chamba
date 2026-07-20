import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AlertsService } from './alerts.service';

function build() {
  const prisma = {
    jobAlert: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  };
  return { service: new AlertsService(prisma as never), prisma };
}
const user = { id: 'u1', email: 'u@t.com', isAdmin: false };

describe('AlertsService', () => {
  it('findMine filtra por usuario, más recientes primero', () => {
    const { service, prisma } = build();
    service.findMine('u1');
    expect(prisma.jobAlert.findMany).toHaveBeenCalledWith({
      where: { userId: 'u1' },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('create normaliza criterios ausentes a null', async () => {
    const { service, prisma } = build();
    prisma.jobAlert.findFirst.mockResolvedValue(null);
    prisma.jobAlert.create.mockResolvedValue({ id: 'al1' });
    await service.create({ department: 'LA_PAZ' } as never, 'u1');
    expect(prisma.jobAlert.create).toHaveBeenCalledWith({
      data: { userId: 'u1', department: 'LA_PAZ', category: null },
    });
  });

  it('create rechaza una alerta duplicada', async () => {
    const { service, prisma } = build();
    prisma.jobAlert.findFirst.mockResolvedValue({ id: 'existe' });
    await expect(service.create({} as never, 'u1')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('remove falla si no existe', async () => {
    const { service, prisma } = build();
    prisma.jobAlert.findUnique.mockResolvedValue(null);
    await expect(service.remove('al1', user)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('remove no permite borrar la alerta de otro usuario', async () => {
    const { service, prisma } = build();
    prisma.jobAlert.findUnique.mockResolvedValue({ id: 'al1', userId: 'otro' });
    await expect(service.remove('al1', user)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('remove borra la alerta propia', async () => {
    const { service, prisma } = build();
    prisma.jobAlert.findUnique.mockResolvedValue({ id: 'al1', userId: 'u1' });
    prisma.jobAlert.delete.mockResolvedValue({});
    await expect(service.remove('al1', user)).resolves.toEqual({ deleted: true });
  });
});
