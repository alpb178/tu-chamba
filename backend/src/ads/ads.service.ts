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
import { GoogleIndexingService } from '../indexing/google-indexing.service';

const includeAuthor = {
  // emailVerified alimenta el badge "Verificado" del portal (señal de
  // confianza pública; no expone ningún dato de contacto).
  createdBy: {
    select: { id: true, name: true, email: true, emailVerified: true },
  },
};

// Conteos de actividad del anuncio (accesos e interesados).
const includeCounts = {
  _count: { select: { visits: true, interests: true } },
};

// Campos mínimos para puntuar el orden del listado público (ver byRelevance),
// sin traer los textos del anuncio.
const selectRanking = {
  id: true,
  salary: true,
  requirements: true,
  location: true,
  locationReference: true,
  department: true,
  category: true,
  schedule: true,
  latitude: true,
  longitude: true,
  createdAt: true,
  _count: { select: { visits: true } },
} satisfies Prisma.AdSelect;

type RankedAd = Prisma.AdGetPayload<{ select: typeof selectRanking }>;

// Datos opcionales que suman al grado de completitud del anuncio (tercer
// criterio de orden). El salario no cuenta aquí: ya es el primer criterio.
const OPTIONAL_FIELDS = [
  'requirements',
  'location',
  'locationReference',
  'department',
  'category',
  'schedule',
] as const;

// Cuántos datos opcionales llenó el publicante (0..7). El pin del mapa cuenta
// como un solo dato aunque sean dos columnas.
function completeness(ad: RankedAd) {
  let score = OPTIONAL_FIELDS.reduce(
    (n, field) => (ad[field] != null && ad[field] !== '' ? n + 1 : n),
    0,
  );
  if (ad.latitude != null && ad.longitude != null) score += 1;
  return score;
}

// Orden del listado público: 1) primero los que tienen salario definido,
// 2) luego los de más accesos acumulados, 3) luego los más completos y
// 4) el más reciente como desempate.
function byRelevance(a: RankedAd, b: RankedAd) {
  const withSalary = (ad: RankedAd) => (ad.salary != null ? 0 : 1);
  return (
    withSalary(a) - withSalary(b) ||
    b._count.visits - a._count.visits ||
    completeness(b) - completeness(a) ||
    b.createdAt.getTime() - a.createdAt.getTime()
  );
}

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
    private indexing: GoogleIndexingService,
  ) {}

  // Listado público: solo anuncios vigentes (activos y no vencidos), ordenados
  // por relevancia (salario definido → accesos → completitud).
  async findAll(query: QueryAdDto) {
    return this.paginate(query, whereActive(), 'relevance');
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
        // El techo del deslizador considera los rangos: un anuncio "3500 a
        // 4500" empuja el máximo a 4500, no a 3500.
        _max: { salary: true, salaryMax: true },
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
      salaryMax: Math.max(
        agg._max.salary ? Number(agg._max.salary) : 0,
        agg._max.salaryMax ? Number(agg._max.salaryMax) : 0,
      ),
    };
  }

  // Listado para el panel admin: incluye vencidos y dados de baja, con los
  // filtros del reporte (solo clientes, rango de fechas, publicante, estado).
  async findAllAdmin(query: QueryAdDto) {
    const base: Prisma.AdWhereInput = {};

    const createdBy: Prisma.UserWhereInput = {};
    if (query.clientsOnly === 'true') createdBy.isAdmin = false;
    if (query.owner) {
      createdBy.OR = [
        { email: { contains: query.owner, mode: 'insensitive' } },
        { name: { contains: query.owner, mode: 'insensitive' } },
      ];
    }
    if (Object.keys(createdBy).length) base.createdBy = createdBy;
    if (query.from || query.to) {
      base.createdAt = {};
      if (query.from) base.createdAt.gte = new Date(query.from);
      // Hasta el final del día indicado.
      if (query.to) base.createdAt.lte = new Date(`${query.to}T23:59:59.999Z`);
    }
    // VENCIDO no se persiste: se traduce a "activo con vigencia pasada".
    if (query.status === 'ACTIVO') {
      base.status = AdStatus.ACTIVO;
      base.expiresAt = { gt: new Date() };
    } else if (query.status === 'VENCIDO') {
      base.status = AdStatus.ACTIVO;
      base.expiresAt = { lte: new Date() };
    } else if (query.status === 'DADO_DE_BAJA') {
      base.status = AdStatus.DADO_DE_BAJA;
    }

    return this.paginate(query, base);
  }

  private async paginate(
    query: QueryAdDto,
    base: Prisma.AdWhereInput,
    order: 'recent' | 'relevance' = 'recent',
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const where: Prisma.AdWhereInput = { ...base };

    const jobTypes = parseEnums<JobType>(query.jobType, JOB_TYPES);
    const departments = parseEnums<Department>(query.department, DEPARTMENTS);
    const categories = parseEnums<Category>(query.category, CATEGORIES);
    if (jobTypes.length) where.jobType = { in: jobTypes };
    if (departments.length) where.department = { in: departments };
    if (categories.length) where.category = { in: categories };

    // El sueldo del anuncio puede ser un monto fijo (salary) o un rango
    // [salary, salaryMax]: pasan los que se solapan con el rango pedido. Los
    // anuncios sin salario quedan fuera al filtrar por sueldo, como antes.
    if (query.salaryMin != null || query.salaryMax != null) {
      // El piso del anuncio no puede superar el techo pedido.
      if (query.salaryMax != null) where.salary = { lte: query.salaryMax };
      if (query.salaryMin != null) {
        // El techo del anuncio es salaryMax si es un rango; si no, su salary.
        where.AND = [
          {
            OR: [
              { salaryMax: { gte: query.salaryMin } },
              { salaryMax: null, salary: { gte: query.salaryMin } },
            ],
          },
        ];
      }
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { requirements: { contains: query.search, mode: 'insensitive' } },
        { location: { contains: query.search, mode: 'insensitive' } },
        { locationReference: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Filtro del campo "dónde" del buscador (ciudad o zona).
    if (query.location) {
      where.location = { contains: query.location, mode: 'insensitive' };
    }

    if (order === 'relevance') return this.pageByRelevance(where, page, limit);

    const [items, total] = await Promise.all([
      this.prisma.ad.findMany({
        where,
        // includeCounts añade _count.visits para el contador de las tarjetas.
        include: { ...includeAuthor, ...includeCounts },
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

  // Página del listado público ordenada por relevancia. Prisma no puede
  // ordenar por "tiene salario" ni por completitud (son expresiones
  // calculadas), así que se traen solo los campos de ranking de los anuncios
  // que pasan el filtro —los vigentes, un conjunto acotado—, se ordenan aquí y
  // se hidrata únicamente la página pedida.
  private async pageByRelevance(
    where: Prisma.AdWhereInput,
    page: number,
    limit: number,
  ) {
    const ranked = await this.prisma.ad.findMany({
      where,
      select: selectRanking,
    });
    ranked.sort(byRelevance);

    const total = ranked.length;
    const ids = ranked.slice((page - 1) * limit, page * limit).map((a) => a.id);
    const rows = ids.length
      ? await this.prisma.ad.findMany({
          where: { id: { in: ids } },
          include: { ...includeAuthor, ...includeCounts },
        })
      : [];
    // findMany con "in" no respeta el orden de los ids: se reordena aquí.
    const byId = new Map(rows.map((row) => [row.id, row]));
    const items = ids
      .map((id) => byId.get(id))
      .filter((row): row is (typeof rows)[number] => row != null);

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

  // Detalle público: los teléfonos y la ubicación (con su referencia) solo se
  // exponen a usuarios con sesión (regla de negocio). Los anónimos ven el resto
  // (para SEO); el departamento sí queda visible como zona general.
  async findOnePublic(id: string, user: AuthUser | null) {
    const ad = await this.findOne(id);
    void this.traces.record(
      TraceType.AD_VIEWED,
      `Detalle del anuncio "${summary(ad.description)}" visto por ${user?.email ?? 'un visitante anónimo'}`,
      user,
      { resource: `ad:${id}` },
    );
    if (user) return ad;
    const {
      phone: _phone,
      extraPhones: _extraPhones,
      location: _location,
      locationReference: _reference,
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
      select: {
        phone: true,
        extraPhones: true,
        location: true,
        locationReference: true,
        latitude: true,
        longitude: true,
      },
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
      { resource: `ad:${ad.id}` },
    );
    // Google indexa la oferta mientras está viva (fire-and-forget).
    void this.indexing.notifyUpdated(ad.id);
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
          // createMany arma un INSERT con la unión de columnas de todo el lote:
          // las filas sin teléfonos adicionales mandarían NULL explícito en vez
          // de tomar el default, y la columna es NOT NULL.
          extraPhones: dto.extraPhones ?? [],
          durationDays,
          expiresAt: expiryDate(durationDays, now),
          createdById: user.id,
        };
      }),
    });
    await this.traces.record(
      TraceType.AD_IMPORTED,
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

    const updated = await this.prisma.ad.update({
      where: { id },
      data,
      include: includeAuthor,
    });
    await this.traces.record(
      TraceType.AD_UPDATED,
      `Anuncio "${summary(updated.description)}" editado por ${user.email}`,
      user,
      { resource: `ad:${id}` },
    );
    void this.indexing.notifyUpdated(id);
    return updated;
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
      { resource: `ad:${id}` },
    );
    void this.indexing.notifyDeleted(id);
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
      { resource: `ad:${id}` },
    );
    void this.indexing.notifyUpdated(id);
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
      { resource: `ad:${id}` },
    );
    void this.indexing.notifyDeleted(id);
    return { deleted: true };
  }

  // Borrado físico por lotes (panel admin). Como en bulkCreate se deja una
  // única traza resumen; la indexación se notifica por anuncio con el mismo
  // tope que el barrido de vencidos para cuidar la cuota diaria de la API.
  async bulkRemove(ids: string[], user: AuthUser) {
    const existing = await this.prisma.ad.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
    const { count } = await this.prisma.ad.deleteMany({
      where: { id: { in: existing.map((ad) => ad.id) } },
    });
    await this.traces.record(
      TraceType.AD_DELETED,
      `Borrado por lotes: ${count} anuncios eliminados por ${user.email}`,
      user,
    );
    for (const ad of existing.slice(0, 100)) {
      void this.indexing.notifyDeleted(ad.id);
    }
    return { deleted: count };
  }

  // Borrado físico de todos los anuncios (panel admin). Igual que el borrado
  // por lotes: traza resumen única e indexación notificada por anuncio con
  // tope de 100 para cuidar la cuota diaria de la API.
  async removeAll(user: AuthUser, clientsOnly = false) {
    // clientsOnly: solo los anuncios de clientes (reporte del panel).
    const where = clientsOnly ? { createdBy: { isAdmin: false } } : {};
    const existing = await this.prisma.ad.findMany({
      where,
      select: { id: true },
    });
    const { count } = await this.prisma.ad.deleteMany({ where });
    await this.traces.record(
      TraceType.AD_DELETED,
      `Borrado total: ${count} anuncios${clientsOnly ? ' de clientes' : ''} eliminados por ${user.email}`,
      user,
    );
    for (const ad of existing.slice(0, 100)) {
      void this.indexing.notifyDeleted(ad.id);
    }
    return { deleted: count };
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
