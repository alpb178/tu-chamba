import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Categoria,
  Departamento,
  EstadoAnuncio,
  Prisma,
  Role,
  TipoJornada,
  TraceType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnuncioDto } from './dto/create-anuncio.dto';
import { UpdateAnuncioDto } from './dto/update-anuncio.dto';
import {
  CATEGORIAS,
  DEPARTAMENTOS,
  JORNADAS,
  QueryAnuncioDto,
} from './dto/query-anuncio.dto';
import { AuthUser } from '../auth/decorators/current-user.decorator';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { TracesService } from '../traces/traces.service';

const includeAutor = {
  createdBy: { select: { id: true, nombre: true, email: true } },
};

const DIA_MS = 24 * 60 * 60 * 1000;

function expiraEn(duracionDias: number, desde = new Date()) {
  return new Date(desde.getTime() + duracionDias * DIA_MS);
}

// "VENTAS,GASTRONOMIA" -> ['VENTAS','GASTRONOMIA'], filtrando valores válidos.
function parseEnums<T extends string>(csv: string | undefined, validos: T[]): T[] {
  if (!csv) return [];
  return csv
    .split(',')
    .map((s) => s.trim())
    .filter((s): s is T => (validos as string[]).includes(s));
}

// Solo anuncios vigentes (activos y no vencidos) — regla de negocio compartida.
function whereVigente(): Prisma.AnuncioWhereInput {
  return { estado: EstadoAnuncio.ACTIVO, expiraEn: { gt: new Date() } };
}

// Descripción corta para las trazas del sistema.
function resumen(descripcion: string) {
  return descripcion.length > 60 ? `${descripcion.slice(0, 60)}…` : descripcion;
}

@Injectable()
export class AnunciosService {
  constructor(
    private prisma: PrismaService,
    private notificaciones: NotificacionesService,
    private traces: TracesService,
  ) {}

  // Listado público: solo anuncios vigentes (activos y no vencidos).
  async findAll(query: QueryAnuncioDto) {
    return this.paginate(query, whereVigente());
  }

  // Conteos por opción sobre anuncios vigentes (para la barra de filtros).
  async facetas() {
    const where = whereVigente();
    const [porJornada, porDepto, porCat, agg, total] = await Promise.all([
      this.prisma.anuncio.groupBy({ by: ['tipoJornada'], where, _count: true }),
      this.prisma.anuncio.groupBy({ by: ['departamento'], where, _count: true }),
      this.prisma.anuncio.groupBy({ by: ['categoria'], where, _count: true }),
      this.prisma.anuncio.aggregate({
        where,
        _min: { salario: true },
        _max: { salario: true },
      }),
      this.prisma.anuncio.count({ where }),
    ]);

    const conteo = <K extends string>(
      rows: { _count: number }[],
      key: string,
    ): Record<string, number> => {
      const out: Record<string, number> = {};
      for (const r of rows as (Record<string, unknown> & { _count: number })[]) {
        const k = r[key] as K | null;
        if (k) out[k] = r._count;
      }
      return out;
    };

    return {
      total,
      tipoJornada: conteo(porJornada, 'tipoJornada'),
      departamento: conteo(porDepto, 'departamento'),
      categoria: conteo(porCat, 'categoria'),
      salarioMin: agg._min.salario ? Number(agg._min.salario) : 0,
      salarioMax: agg._max.salario ? Number(agg._max.salario) : 0,
    };
  }

  // Listado para el panel admin: incluye vencidos y dados de baja.
  async findAllAdmin(query: QueryAnuncioDto) {
    return this.paginate(query, {});
  }

  private async paginate(query: QueryAnuncioDto, base: Prisma.AnuncioWhereInput) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.AnuncioWhereInput = { ...base };

    const jornadas = parseEnums<TipoJornada>(query.tipoJornada, JORNADAS);
    const deptos = parseEnums<Departamento>(query.departamento, DEPARTAMENTOS);
    const cats = parseEnums<Categoria>(query.categoria, CATEGORIAS);
    if (jornadas.length) where.tipoJornada = { in: jornadas };
    if (deptos.length) where.departamento = { in: deptos };
    if (cats.length) where.categoria = { in: cats };

    if (query.salarioMin != null || query.salarioMax != null) {
      where.salario = {};
      if (query.salarioMin != null) where.salario.gte = query.salarioMin;
      if (query.salarioMax != null) where.salario.lte = query.salarioMax;
    }

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

  // Detalle público: el teléfono de contacto solo se expone a usuarios con
  // sesión (regla de negocio). Los anónimos ven todo lo demás (para SEO).
  async findOnePublic(id: string, user: AuthUser | null) {
    const anuncio = await this.findOne(id);
    if (user) return anuncio;
    const { telefono: _oculto, ...publico } = anuncio;
    return publico;
  }

  // Teléfono de contacto: requiere sesión.
  async getContacto(id: string) {
    const anuncio = await this.prisma.anuncio.findUnique({
      where: { id },
      select: { telefono: true },
    });
    if (!anuncio) throw new NotFoundException('Anuncio no encontrado');
    return { telefono: anuncio.telefono };
  }

  async create(dto: CreateAnuncioDto, userId: string) {
    // Un empleador debe verificar su correo antes de publicar (anti-spam).
    const autor = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, emailVerified: true },
    });
    if (autor?.role === Role.EMPLEADOR && !autor.emailVerified) {
      throw new ForbiddenException(
        'Verifica tu correo para poder publicar anuncios',
      );
    }

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
    // El aviso a suscriptores no debe romper la publicación si falla.
    try {
      await this.notificaciones.notificarNuevoAnuncio(anuncio);
    } catch {
      /* noop: la notificación es best-effort */
    }
    await this.traces.record(
      TraceType.AD_CREATED,
      `Anuncio "${resumen(anuncio.descripcion)}" publicado por ${anuncio.createdBy.email}`,
      anuncio.createdBy,
    );
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
    const actualizado = await this.prisma.anuncio.update({
      where: { id },
      data: { estado: EstadoAnuncio.DADO_DE_BAJA },
      include: includeAutor,
    });
    await this.traces.record(
      TraceType.AD_UNPUBLISHED,
      `Anuncio "${resumen(anuncio.descripcion)}" dado de baja por ${user.email}`,
      user,
    );
    return actualizado;
  }

  // Reactiva un anuncio vencido o dado de baja con una nueva ventana de vigencia.
  async republicar(id: string, user: AuthUser) {
    const anuncio = await this.findOne(id);
    this.assertCanModify(anuncio.createdById, user);
    const actualizado = await this.prisma.anuncio.update({
      where: { id },
      data: {
        estado: EstadoAnuncio.ACTIVO,
        expiraEn: expiraEn(anuncio.duracionDias),
        // Permite volver a notificar cuando venza esta nueva ventana.
        vencimientoNotificado: false,
      },
      include: includeAutor,
    });
    await this.traces.record(
      TraceType.AD_REPUBLISHED,
      `Anuncio "${resumen(anuncio.descripcion)}" republicado por ${user.email}`,
      user,
    );
    return actualizado;
  }

  // Borrado físico: reservado al ADMIN (los dueños usan la baja).
  async remove(id: string, user: AuthUser) {
    const anuncio = await this.findOne(id);
    await this.prisma.anuncio.delete({ where: { id } });
    await this.traces.record(
      TraceType.AD_DELETED,
      `Anuncio "${resumen(anuncio.descripcion)}" eliminado por ${user.email}`,
      user,
    );
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
