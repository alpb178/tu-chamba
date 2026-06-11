import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnuncioDto } from './dto/create-anuncio.dto';
import { UpdateAnuncioDto } from './dto/update-anuncio.dto';
import { QueryAnuncioDto } from './dto/query-anuncio.dto';
import { AuthUser } from '../auth/decorators/current-user.decorator';

const includeAutor = {
  createdBy: { select: { id: true, nombre: true, email: true } },
};

@Injectable()
export class AnunciosService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryAnuncioDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.AnuncioWhereInput = {};
    if (query.tipoJornada) where.tipoJornada = query.tipoJornada;
    if (query.search) {
      where.descripcion = { contains: query.search, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      this.prisma.anuncio.findMany({
        where,
        include: includeAutor,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.anuncio.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const anuncio = await this.prisma.anuncio.findUnique({
      where: { id },
      include: includeAutor,
    });
    if (!anuncio) throw new NotFoundException('Anuncio no encontrado');
    return anuncio;
  }

  create(dto: CreateAnuncioDto, userId: string) {
    return this.prisma.anuncio.create({
      data: { ...dto, createdById: userId },
      include: includeAutor,
    });
  }

  async update(id: string, dto: UpdateAnuncioDto, user: AuthUser) {
    const anuncio = await this.findOne(id);
    this.assertCanModify(anuncio.createdById, user);
    return this.prisma.anuncio.update({
      where: { id },
      data: dto,
      include: includeAutor,
    });
  }

  async remove(id: string, user: AuthUser) {
    const anuncio = await this.findOne(id);
    this.assertCanModify(anuncio.createdById, user);
    await this.prisma.anuncio.delete({ where: { id } });
    return { deleted: true };
  }

  async findMine(userId: string) {
    return this.prisma.anuncio.findMany({
      where: { createdById: userId },
      include: includeAutor,
      orderBy: { createdAt: 'desc' },
    });
  }

  // Solo el dueño del anuncio o un ADMIN pueden modificar/eliminar.
  private assertCanModify(ownerId: string, user: AuthUser) {
    if (user.role !== Role.ADMIN && user.id !== ownerId) {
      throw new ForbiddenException('No puedes modificar este anuncio');
    }
  }
}
