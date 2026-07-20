import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TraceType } from '@prisma/client';
import { ReviewsService } from './reviews.service';
import { AuthUser } from '../auth/decorators/current-user.decorator';

function buildService() {
  const prisma = {
    ad: { findUnique: jest.fn() },
    review: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  };
  const notifications = { notifyReview: jest.fn() };
  const traces = { record: jest.fn() };
  const service = new ReviewsService(
    prisma as never,
    notifications as never,
    traces as never,
  );
  return { service, prisma, notifications, traces };
}

const adminUser: AuthUser = { id: 'adm', email: 'admin@t.com', isAdmin: true };
const authorUser: AuthUser = { id: 'author', email: 'a@t.com', isAdmin: false };

const ad = { id: 'a1', createdById: 'owner1', description: 'Anuncio de prueba' };
const dto = { adId: 'a1', rating: 4, comment: 'Bien' };

describe('ReviewsService.create', () => {
  it('cualquier usuario puede calificar un anuncio ajeno', async () => {
    const { service, prisma, notifications } = buildService();
    prisma.ad.findUnique.mockResolvedValue(ad);
    prisma.review.create.mockResolvedValue({
      id: 'r1',
      ownerId: 'owner1',
      rating: 4,
      comment: 'Bien',
      author: { id: 'u2', name: 'Beto' },
    });

    await service.create(dto, 'u2');
    expect(prisma.review.create.mock.calls[0][0].data.ownerId).toBe('owner1');
    expect(notifications.notifyReview).toHaveBeenCalled();
  });

  it('nadie puede calificar su propio anuncio', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findUnique.mockResolvedValue(ad);

    await expect(service.create(dto, 'owner1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('una sola reseña por anuncio (P2002 → 409)', async () => {
    const { service, prisma } = buildService();
    prisma.ad.findUnique.mockResolvedValue(ad);
    prisma.review.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('dup', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await expect(service.create(dto, 'u2')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});

describe('ReviewsService.findByOwner', () => {
  it('marca alreadyReviewed cuando el usuario ya calificó ese anuncio', async () => {
    const { service, prisma } = buildService();
    prisma.review.findMany.mockResolvedValue([]);
    prisma.review.aggregate.mockResolvedValue({
      _avg: { rating: 4 },
      _count: 1,
    });
    prisma.review.findUnique.mockResolvedValue({ id: 'r1' });

    const res = await service.findByOwner('owner1', 1, 20, {
      adId: 'a1',
      userId: 'u2',
    });
    expect(res.alreadyReviewed).toBe(true);
  });
});

describe('ReviewsService.update (moderación)', () => {
  it('falla si la reseña no existe', async () => {
    const { service, prisma } = buildService();
    prisma.review.findUnique.mockResolvedValue(null);
    await expect(
      service.update('r1', { rating: 3 }, adminUser),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('actualiza calificación y comentario (recortado) y deja traza', async () => {
    const { service, prisma, traces } = buildService();
    prisma.review.findUnique.mockResolvedValue({ id: 'r1', rating: 5 });
    prisma.review.update.mockResolvedValue({ id: 'r1', rating: 3 });

    await service.update('r1', { rating: 3, comment: '  ok  ' }, adminUser);
    const data = prisma.review.update.mock.calls[0][0].data;
    expect(data).toEqual({ rating: 3, comment: 'ok' });
    expect(traces.record).toHaveBeenCalledWith(
      TraceType.REVIEW_UPDATED,
      expect.any(String),
      adminUser,
      { resource: 'review:r1' },
    );
  });
});

describe('ReviewsService.remove', () => {
  it('falla si no existe', async () => {
    const { service, prisma } = buildService();
    prisma.review.findUnique.mockResolvedValue(null);
    await expect(service.remove('r1', adminUser)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('un usuario ajeno (no autor, no admin) no puede borrarla', async () => {
    const { service, prisma } = buildService();
    prisma.review.findUnique.mockResolvedValue({ id: 'r1', authorId: 'otro' });
    await expect(
      service.remove('r1', { id: 'x', email: 'x@t', isAdmin: false }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('el autor puede borrar su reseña', async () => {
    const { service, prisma } = buildService();
    prisma.review.findUnique.mockResolvedValue({ id: 'r1', authorId: 'author', rating: 4 });
    prisma.review.delete.mockResolvedValue({});
    await expect(service.remove('r1', authorUser)).resolves.toEqual({
      deleted: true,
    });
  });

  it('el admin puede moderar (borrar) cualquier reseña', async () => {
    const { service, prisma } = buildService();
    prisma.review.findUnique.mockResolvedValue({ id: 'r1', authorId: 'otro', rating: 2 });
    prisma.review.delete.mockResolvedValue({});
    await expect(service.remove('r1', adminUser)).resolves.toEqual({
      deleted: true,
    });
  });
});

describe('ReviewsService.removeMany / removeAll', () => {
  it('removeMany borra por lotes con traza resumen', async () => {
    const { service, prisma, traces } = buildService();
    prisma.review.deleteMany.mockResolvedValue({ count: 2 });
    await expect(service.removeMany(['r1', 'r2'], adminUser)).resolves.toEqual({
      deleted: 2,
    });
    expect(prisma.review.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['r1', 'r2'] } },
    });
    expect(traces.record).toHaveBeenCalledWith(
      TraceType.REVIEW_DELETED,
      expect.stringContaining('2'),
      adminUser,
    );
  });

  it('removeAll borra todas', async () => {
    const { service, prisma } = buildService();
    prisma.review.deleteMany.mockResolvedValue({ count: 8 });
    await expect(service.removeAll(adminUser)).resolves.toEqual({ deleted: 8 });
    expect(prisma.review.deleteMany).toHaveBeenCalledWith({});
  });
});

describe('ReviewsService.findAllAdmin (reporte de moderación)', () => {
  it('filtra por calificación, búsqueda y rango de fechas, y pagina', async () => {
    const { service, prisma } = buildService();
    prisma.review.findMany.mockResolvedValue([{ id: 'r1' }]);
    (prisma.review as { count: jest.Mock }).count = jest.fn().mockResolvedValue(1);

    const res = await service.findAllAdmin({
      rating: 4,
      search: 'malo',
      from: '2026-07-01',
      to: '2026-07-10',
      page: 1,
      limit: 20,
    } as never);

    const where = prisma.review.findMany.mock.calls[0][0].where;
    expect(where.rating).toBe(4);
    expect(where.OR).toBeDefined(); // comment/author/owner
    expect(where.createdAt.gte).toEqual(new Date('2026-07-01'));
    expect(where.createdAt.lte).toEqual(new Date('2026-07-10T23:59:59.999Z'));
    expect(res).toMatchObject({ total: 1, page: 1, totalPages: 1 });
  });
});
