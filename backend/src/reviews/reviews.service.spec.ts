import { BadRequestException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ReviewsService } from './reviews.service';

function buildService() {
  const prisma = {
    ad: { findUnique: jest.fn() },
    review: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
      delete: jest.fn(),
    },
  };
  const notifications = { notifyReview: jest.fn() };
  const service = new ReviewsService(prisma as never, notifications as never);
  return { service, prisma, notifications };
}

const ad = { id: 'a1', createdById: 'owner1' };
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
