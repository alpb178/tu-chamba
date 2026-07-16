import { ForbiddenException } from '@nestjs/common';
import { AdsService } from './ads.service';
import { AuthUser } from '../auth/decorators/current-user.decorator';

function buildService() {
  const prisma = {
    ad: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    user: { findUnique: jest.fn() },
    review: { groupBy: jest.fn().mockResolvedValue([]) },
  };
  const notifications = { notifyNewAd: jest.fn() };
  const traces = { record: jest.fn() };
  const indexing = { notifyUpdated: jest.fn(), notifyDeleted: jest.fn() };
  const service = new AdsService(
    prisma as never,
    notifications as never,
    traces as never,
    indexing as never,
  );
  return { service, prisma, notifications, traces, indexing };
}

const owner: AuthUser = { id: 'u1', email: 'a@t.com', isAdmin: false };
const other: AuthUser = { id: 'u2', email: 'b@t.com', isAdmin: false };
const admin: AuthUser = { id: 'u3', email: 'admin@t.com', isAdmin: true };

const dto = {
  description: 'Prueba',
  salary: 100,
  phone: '70000000',
  jobType: 'DIARIA',
} as never;

const existingAd = {
  id: 'a1',
  description: 'Prueba',
  createdById: 'u1',
  durationDays: 3,
  createdBy: { id: 'u1', name: 'Ana', email: 'a@t.com' },
};

describe('AdsService.create', () => {
  it('cualquier usuario verificado puede publicar', async () => {
    const { service, prisma } = buildService();
    prisma.user.findUnique.mockResolvedValue({ emailVerified: true });
    prisma.ad.create.mockResolvedValue(existingAd);

    await service.create(dto, owner);
    expect(prisma.ad.create).toHaveBeenCalled();
    expect(prisma.ad.create.mock.calls[0][0].data.createdById).toBe('u1');
  });

  it('bloquea publicar con correo sin verificar (no admin)', async () => {
    const { service, prisma } = buildService();
    prisma.user.findUnique.mockResolvedValue({ emailVerified: false });

    await expect(service.create(dto, owner)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('el admin publica sin comprobación de verificación', async () => {
    const { service, prisma } = buildService();
    prisma.ad.create.mockResolvedValue(existingAd);

    await service.create(dto, admin);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
});

describe('propiedad del recurso (editar/eliminar)', () => {
  it('el dueño puede editar su anuncio', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findUnique.mockResolvedValue(existingAd);
    prisma.ad.update.mockResolvedValue(existingAd);

    await service.update('a1', {} as never, owner);
    expect(prisma.ad.update).toHaveBeenCalled();
  });

  it('otro usuario no puede editar un anuncio ajeno', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findUnique.mockResolvedValue(existingAd);

    await expect(
      service.update('a1', {} as never, other),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('el dueño puede eliminar su anuncio; otro usuario no', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findUnique.mockResolvedValue(existingAd);
    prisma.ad.delete.mockResolvedValue(existingAd);

    await service.remove('a1', owner);
    expect(prisma.ad.delete).toHaveBeenCalled();

    prisma.ad.delete.mockClear();
    await expect(service.remove('a1', other)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.ad.delete).not.toHaveBeenCalled();
  });

  it('el admin puede modificar anuncios ajenos', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findUnique.mockResolvedValue(existingAd);
    prisma.ad.update.mockResolvedValue(existingAd);

    await service.unpublish('a1', admin);
    expect(prisma.ad.update).toHaveBeenCalled();
  });
});
