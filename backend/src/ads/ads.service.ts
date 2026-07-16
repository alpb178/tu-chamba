import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AdStatus,
  Category,
  Department,
  JobType,
  Prisma,
  TraceType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';
import {
  CATEGORIES,
  DEPARTMENTS,
  JOB_TYPES,
  QueryAdDto,
} from './dto/query-ad.dto';
import { AuthUser } from '../auth/decorators/current-user.decorator';
import { NotificationsService } from '../notifications/notifications.service';
import { TracesService } from '../traces/traces.service';

const includeAuthor = {
  createdBy: { select: { id: true, name: true, email: true } },
};

// Conteos de actividad del anuncio (accesos e interesados).
const includeCounts = {
  _count: { select: { visits: true, interests: true } },
};

const DAY_MS = 24 * 60 * 60 * 1000;

function expiryDate(durationDays: number, from = new Date()) {
  return new Date(from.getTime() + durationDays * DAY_MS);
}

// "VENTAS,GASTRONOMIA" -> ['VENTAS','GASTRONOMIA'], filtrando valores válidos.
function parseEnums<T extends string>(csv: string | undefined, valid: T[]): T[] {
  if (!csv) return [];
  return csv
    .split(',')
    .map((s) => s.trim())
    .filter((s): s is T => (valid as string[]).includes(s));
}

// Solo anuncios vigentes (activos y no vencidos) — regla de negocio compartida.
function whereActive(): Prisma.AdWhereInput {
  return { status: AdStatus.ACTIVO, expiresAt: { gt: new Date() } };
}

// Descripción corta para las trazas del sistema.
function summary(description: string) {
  return description.length > 60 ? `${description.slice(0, 60)}…` : description;
}

@Injectable()
export class AdsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private traces: TracesService,
  ) {}

  // Listado público: solo anuncios vigentes (activos y no vencidos).
  async findAll(query: QueryAdDto) {
    return this.paginate(query, whereActive());
  }

  // Conteos por opción sobre anuncios vigentes (para la barra de filtros).
  async facets() {
    const where = whereActive();
    const [byJobType, byDepartment, byCategory, agg, total] = await Promise.all([
      this.prisma.ad.groupBy({ by: ['jobType'], where, _count: true }),
      this.prisma.ad.groupBy({ by: ['department'], where, _count: true }),
      this.prisma.ad.groupBy({ by: ['category'], where, _count: true }),
      this.prisma.ad.aggregate({
        where,
        _min: { salary: true },
        _max: { salary: true },
      }),
      this.prisma.ad.count({ where }),
    ]);

    const counts = <K extends string>(
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
      jobType: counts(byJobType, 'jobType'),
      department: counts(byDepartment, 'department'),
      category: counts(byCategory, 'category'),
      salaryMin: agg._min.salary ? Number(agg._min.salary) : 0,
      salaryMax: agg._max.salary ? Number(agg._max.salary) : 0,
    };
  }

  // Listado para el panel admin: incluye vencidos y dados de baja.
  async findAllAdmin(query: QueryAdDto) {
    return this.paginate(query, {});
  }

  private async paginate(query: QueryAdDto, base: Prisma.AdWhereInput) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const where: Prisma.AdWhereInput = { ...base };

    const jobTypes = parseEnums<JobType>(query.jobType, JOB_TYPES);
    const departments = parseEnums<Department>(query.department, DEPARTMENTS);
    const categories = parseEnums<Category>(query.category, CATEGORIES);
    if (jobTypes.length) where.jobType = { in: jobTypes };
    if (departments.length) where.department = { in: departments };
    if (categories.length) where.category = { in: categories };

    if (query.salaryMin != null || query.salaryMax != null) {
      where.salary = {};
      if (query.salaryMin != null) where.salary.gte = query.salaryMin;
      if (query.salaryMax != null) where.salary.lte = query.salaryMax;
    }

    if (query.search) {
      where.OR = [
        { description: { contains: query.search, mode: 'insensitive' } },
        { requirements: { contains: query.search, mode: 'insensitive' } },
        { location: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Filtro del campo "dónde" del buscador (ciudad o zona).
    if (query.location) {
      where.location = { contains: query.location, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      this.prisma.ad.findMany({
        where,
        include: includeAuthor,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.ad.count({ where }),
    ]);

    return {
      items: await this.attachOwnerRatings(items),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Calificación del publicante (promedio y conteo de reseñas) para mostrar
  // en las tarjetas del listado, con una sola consulta agrupada por página.
  private async attachOwnerRatings<T extends { createdById: string }>(
    items: T[],
  ) {
    const ownerIds = [...new Set(items.map((i) => i.createdById))];
    if (!ownerIds.length) return [];

    const grouped = await this.prisma.review.groupBy({
      by: ['ownerId'],
      where: { ownerId: { in: ownerIds } },
      _avg: { rating: true },
      _count: true,
    });
    const byOwner = new Map(
      grouped.map((g) => [
        g.ownerId,
        { average: g._avg.rating, count: g._count },
      ]),
    );

    return items.map((item) => ({
      ...item,
      ownerRating: byOwner.get(item.createdById) ?? {
        average: null,
        count: 0,
      },
    }));
  }

  async findOne(id: string) {
    const ad = await this.prisma.ad.findUnique({
      where: { id },
      include: { ...includeAuthor, ...includeCounts },
    });
    if (!ad) throw new NotFoundException('Anuncio no encontrado');
    return ad;
  }

  // Detalle público: el teléfono y la ubicación solo se exponen a usuarios
  // con sesión (regla de negocio). Los anónimos ven el resto (para SEO); el
  // departamento sí queda visible como zona general.
  async findOnePublic(id: string, user: AuthUser | null) {
    const ad = await this.findOne(id);
    if (user) return ad;
    const {
      phone: _phone,
      location: _location,
      latitude: _lat,
      longitude: _lng,
      ...publicAd
    } = ad;
    return publicAd;
  }

  // Contacto y ubicación del anuncio: requieren sesión.
  async getContact(id: string) {
    const ad = await this.prisma.ad.findUnique({
      where: { id },
      select: { phone: true, location: true, latitude: true, longitude: true },
    });
    if (!ad) throw new NotFoundException('Anuncio no encontrado');
    return ad;
  }

  async create(dto: CreateAdDto, user: AuthUser) {
    // Anti-spam: hay que verificar el correo antes de publicar (admin exento).
    if (!user.isAdmin) {
      const author = await this.prisma.user.findUnique({
        where: { id: user.id },
        select: { emailVerified: true },
      });
      if (!author?.emailVerified) {
        throw new ForbiddenException(
          'Verifica tu correo para poder publicar anuncios',
        );
      }
    }

    const durationDays = dto.durationDays ?? 3;
    const ad = await this.prisma.ad.create({
      data: {
        ...dto,
        durationDays,
        expiresAt: expiryDate(durationDays),
        createdById: user.id,
      },
      include: includeAuthor,
    });
    // El aviso a suscriptores no debe romper la publicación si falla.
    try {
      await this.notifications.notifyNewAd(ad);
    } catch {
      /* noop: la notificación es best-effort */
    }
    await this.traces.record(
      TraceType.AD_CREATED,
      `Anuncio "${summary(ad.description)}" publicado por ${ad.createdBy.email}`,
      ad.createdBy,
    );
    return ad;
  }

  // Importación masiva desde el panel admin (CSV). A diferencia de create():
  // no notifica a suscriptores (evitaría una ráfaga de correos), deja una
  // única traza resumen en lugar de una por anuncio, y la duración por
  // defecto es de 7 días (regla de importación).
  async bulkCreate(dtos: CreateAdDto[], user: AuthUser) {
    const now = new Date();
    const { count } = await this.prisma.ad.createMany({
      data: dtos.map((dto) => {
        const durationDays = dto.durationDays ?? 7;
        return {
          ...dto,
          durationDays,
          expiresAt: expiryDate(durationDays, now),
          createdById: user.id,
        };
      }),
    });
    await this.traces.record(
      TraceType.AD_CREATED,
      `Importación CSV: ${count} anuncios publicados por ${user.email}`,
      user,
    );
    return { created: count };
  }

  async update(id: string, dto: UpdateAdDto, user: AuthUser) {
    const ad = await this.findOne(id);
    this.assertCanModify(ad.createdById, user);

    // Cambiar la duración extiende la vigencia desde ahora.
    const data: Prisma.AdUpdateInput = { ...dto };
    if (dto.durationDays && dto.durationDays !== ad.durationDays) {
      data.expiresAt = expiryDate(dto.durationDays);
    }

    return this.prisma.ad.update({
      where: { id },
      data,
      include: includeAuthor,
    });
  }

  // Baja manual: el anuncio deja de listarse públicamente pero no se borra.
  async unpublish(id: string, user: AuthUser) {
    const ad = await this.findOne(id);
    this.assertCanModify(ad.createdById, user);
    const updated = await this.prisma.ad.update({
      where: { id },
      data: { status: AdStatus.DADO_DE_BAJA },
      include: includeAuthor,
    });
    await this.traces.record(
      TraceType.AD_UNPUBLISHED,
      `Anuncio "${summary(ad.description)}" dado de baja por ${user.email}`,
      user,
    );
    return updated;
  }

  // Reactiva un anuncio dado de baja (o vencido aún no barrido por la
  // limpieza horaria) con una nueva ventana de vigencia.
  async republish(id: string, user: AuthUser) {
    const ad = await this.findOne(id);
    this.assertCanModify(ad.createdById, user);
    const updated = await this.prisma.ad.update({
      where: { id },
      data: {
        status: AdStatus.ACTIVO,
        expiresAt: expiryDate(ad.durationDays),
      },
      include: includeAuthor,
    });
    await this.traces.record(
      TraceType.AD_REPUBLISHED,
      `Anuncio "${summary(ad.description)}" republicado por ${user.email}`,
      user,
    );
    return updated;
  }

  // Borrado físico: dueño del anuncio o admin.
  async remove(id: string, user: AuthUser) {
    const ad = await this.findOne(id);
    this.assertCanModify(ad.createdById, user);
    await this.prisma.ad.delete({ where: { id } });
    await this.traces.record(
      TraceType.AD_DELETED,
      `Anuncio "${summary(ad.description)}" eliminado por ${user.email}`,
      user,
    );
    return { deleted: true };
  }

  // Anuncios propios, con accesos e interesados para ver su actividad.
  async findMine(userId: string) {
    return this.prisma.ad.findMany({
      where: { createdById: userId },
      include: { ...includeAuthor, ...includeCounts },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Solo el dueño del anuncio o un admin pueden modificarlo o borrarlo.
  private assertCanModify(ownerId: string, user: AuthUser) {
    if (!user.isAdmin && user.id !== ownerId) {
      throw new ForbiddenException('No puedes modificar este anuncio');
    }
  }
}
