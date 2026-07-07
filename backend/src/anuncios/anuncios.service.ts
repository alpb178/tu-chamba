import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EstadoAnuncio, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnuncioDto } from './dto/create-anuncio.dto';
import { UpdateAnuncioDto } from './dto/update-anuncio.dto';
import { QueryAnuncioDto } from './dto/query-anuncio.dto';
import { AuthUser } from '../auth/decorators/current-user.decorator';
import { NotificacionesService } from '../notificaciones/notificaciones.service';

const includeAutor = {
  createdBy: { select: { id: true, nombre: true, email: true } },
};

const DIA_MS = 24 * 60 * 60 * 1000;

function expiraEn(duracionDias: number, desde = new Date()) {
  return new Date(desde.getTime() + duracionDias * DIA_MS);
}

@Injectable()
export class AnunciosService {
  constructor(
    private prisma: PrismaService,
    private notificaciones: NotificacionesService,
  ) {}

  // Listado público: solo anuncios vigentes (activos y no vencidos).
  async findAll(query: QueryAnuncioDto) {
    return this.paginate(query, {
      estado: EstadoAnuncio.ACTIVO,
      expiraEn: { gt: new Date() },
    });
  }

  // Listado para el panel admin: incluye vencidos y dados de baja.
  async findAllAdmin(query: QueryAnuncioDto) {
    return this.paginate(query, {});
  }

  private async paginate(query: QueryAnuncioDto, base: Prisma.AnuncioWhereInput) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.AnuncioWhereInput = { ...base };
    if (query.tipoJornada) where.tipoJornada = query.tipoJornada;
    if (query.departamento) where.departamento = query.departamento;
    if (query.categoria) where.categoria = query.categoria;
    if (query.search) {
      where.OR = [
        { descripcion: { contains: query.search, mode: 'insensitive' } },
        { requisitos: { contains: query.search, mode: 'insensitive' } },
        { ubicacion: { contains: query.search, mode: 'insensitive' } },
      ];
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

  async create(dto: CreateAnuncioDto, userId: string) {
    const duracionDias = dto.duracionDias ?? 3;
    const anuncio = await this.prisma.anuncio.create({
      data: {
        ...dto,
        duracionDias,
        expiraEn: expiraEn(duracionDias),
        createdById: userId,
      },
      include: includeAutor,
    });
    await this.notificaciones.notificarNuevoAnuncio(anuncio);
    return anuncio;
  }

  async update(id: string, dto: UpdateAnuncioDto, user: AuthUser) {
    const anuncio = await this.findOne(id);
    this.assertCanModify(anuncio.createdById, user);

    // Cambiar la duración extiende la vigencia desde ahora.
    const data: Prisma.AnuncioUpdateInput = { ...dto };
    if (dto.duracionDias && dto.duracionDias !== anuncio.duracionDias) {
      data.expiraEn = expiraEn(dto.duracionDias);
    }

    return this.prisma.anuncio.update({
      where: { id },
      data,
      include: includeAutor,
    });
  }

  // Baja manual: el anuncio deja de listarse públicamente pero no se borra.
  async darDeBaja(id: string, user: AuthUser) {
    const anuncio = await this.findOne(id);
    this.assertCanModify(anuncio.createdById, user);
    return this.prisma.anuncio.update({
      where: { id },
      data: { estado: EstadoAnuncio.DADO_DE_BAJA },
      include: includeAutor,
    });
  }

  // Reactiva un anuncio vencido o dado de baja con una nueva ventana de vigencia.
  async republicar(id: string, user: AuthUser) {
    const anuncio = await this.findOne(id);
    this.assertCanModify(anuncio.createdById, user);
    return this.prisma.anuncio.update({
      where: { id },
      data: {
        estado: EstadoAnuncio.ACTIVO,
        expiraEn: expiraEn(anuncio.duracionDias),
        // Permite volver a notificar cuando venza esta nueva ventana.
        vencimientoNotificado: false,
      },
      include: includeAutor,
    });
  }

  // Borrado físico: reservado al ADMIN (los dueños usan la baja).
  async remove(id: string) {
    await this.findOne(id);
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

  // Solo el dueño del anuncio o un ADMIN pueden modificar/dar de baja.
  private assertCanModify(ownerId: string, user: AuthUser) {
    if (user.role !== Role.ADMIN && user.id !== ownerId) {
      throw new ForbiddenException('No puedes modificar este anuncio');
    }
  }
}
