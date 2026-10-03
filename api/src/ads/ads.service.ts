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
import { endOfDay, startOfDay } from '../common/date-range';

const includeAuthor = {
  // emailVerified feeds the portal's "Verificado" badge (a public trust
  // signal; it exposes no contact data).
  createdBy: {
    select: { id: true, name: true, email: true, emailVerified: true },
  },
};

// Listing activity counts (views and interested users).
const includeCounts = {
  _count: { select: { visits: true, interests: true } },
};

// Minimal fields to score the public listing order (see byRelevance),
// without fetching the listing texts.
const selectRanking = {
  id: true,
  priority: true,
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

// Optional fields that add to the listing's completeness score (third sort
// criterion). Salary does not count here: it is already the first criterion.
const OPTIONAL_FIELDS = [
  'requirements',
  'location',
  'locationReference',
  'department',
  'category',
  'schedule',
] as const;

// How many optional fields the poster filled in (0..7). The map pin counts
// as a single field even though it spans two columns.
function completeness(ad: RankedAd) {
  let score = OPTIONAL_FIELDS.reduce(
    (n, field) => (ad[field] != null && ad[field] !== '' ? n + 1 : n),
    0,
  );
  if (ad.latitude != null && ad.longitude != null) score += 1;
  return score;
}

// Public listing order: 0) the priority set by hand from the panel overrides
// everything else, 1) then those with a defined salary, 2) then those with
// the most accumulated views, 3) then the most complete ones and 4) the most
// recent as a tiebreaker.
function byRelevance(a: RankedAd, b: RankedAd) {
  const withSalary = (ad: RankedAd) => (ad.salary != null ? 0 : 1);
  return (
    b.priority - a.priority ||
    withSalary(a) - withSalary(b) ||
    b._count.visits - a._count.visits ||
    completeness(b) - completeness(a) ||
    b.createdAt.getTime() - a.createdAt.getTime()
  );
}

// Priority is a panel tool: if whoever posts or edits has no access to the
// panel, the field is dropped even if it comes in the request body (nobody
// sneaks to the top of the list by posting from the portal).
function stripAdminOnly<T extends { priority?: number }>(
  dto: T,
  user: AuthUser,
): T {
  if (user.isAdmin) return dto;
  const { priority: _ignored, ...rest } = dto;
  return rest as T;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function expiryDate(durationDays: number, from = new Date()) {
  return new Date(from.getTime() + durationDays * DAY_MS);
}

// "VENTAS,GASTRONOMIA" -> ['VENTAS','GASTRONOMIA'], keeping only valid values.
function parseEnums<T extends string>(csv: string | undefined, valid: T[]): T[] {
  if (!csv) return [];
  return csv
    .split(',')
    .map((s) => s.trim())
    .filter((s): s is T => (valid as string[]).includes(s));
}

// Only live listings (active and not expired) — shared business rule.
function whereActive(): Prisma.AdWhereInput {
  return { status: AdStatus.ACTIVO, expiresAt: { gt: new Date() } };
}

// The priority number is an internal panel tool: it is only sent in the
// admin view (/listings/all). The portal gets `featured` instead, which is
// enough to mark the card as featured without revealing the assigned
// position.
function toPublicAd<T extends { priority?: number }>(ad: T) {
  const { priority, ...rest } = ad;
  return { ...rest, featured: (priority ?? 0) > 0 };
}

// Short description for the system traces.
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

  // Public list: only live listings (active and not expired), sorted by
  // relevance (defined salary → views → completeness).
  async findAll(query: QueryAdDto) {
    const page = await this.paginate(query, whereActive(), 'relevance');
    return { ...page, items: page.items.map(toPublicAd) };
  }

  // Per-option counts over live listings (for the filter bar).
  async facets() {
    const where = whereActive();
    const [byJobType, byDepartment, byCategory, agg, total] = await Promise.all([
      this.prisma.ad.groupBy({ by: ['jobType'], where, _count: true }),
      this.prisma.ad.groupBy({ by: ['department'], where, _count: true }),
      this.prisma.ad.groupBy({ by: ['category'], where, _count: true }),
      this.prisma.ad.aggregate({
        where,
        _min: { salary: true },
        // The slider ceiling takes ranges into account: a "3500 a 4500"
        // listing pushes the maximum to 4500, not 3500.
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

  // List for the admin panel: includes expired and deactivated listings, with
  // the report filters (clients only, date range, poster, status).
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
      if (query.from) base.createdAt.gte = startOfDay(query.from);
      // Up to the end of the given day (Bolivia time).
      if (query.to) base.createdAt.lte = endOfDay(query.to);
    }
    // VENCIDO is not persisted: it translates to "active with past validity".
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

    // The listing salary can be a fixed amount (salary) or a range
    // [salary, salaryMax]: those overlapping the requested range pass.
    // Listings without a salary are left out when filtering by salary, as before.
    if (query.salaryMin != null || query.salaryMax != null) {
      // The listing floor cannot exceed the requested ceiling.
      if (query.salaryMax != null) where.salary = { lte: query.salaryMax };
      if (query.salaryMin != null) {
        // The listing ceiling is salaryMax if it is a range; otherwise its salary.
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

    // Filter for the search bar's "dónde" field (city or area).
    if (query.location) {
      where.location = { contains: query.location, mode: 'insensitive' };
    }

    if (order === 'relevance') return this.pageByRelevance(where, page, limit);

    const [items, total] = await Promise.all([
      this.prisma.ad.findMany({
        where,
        // includeCounts adds _count.visits for the cards' counter.
        include: { ...includeAuthor, ...includeCounts },
        // The panel mirrors the portal's criterion: listings prioritized by
        // hand lead the list, then the most recent ones.
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
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

  // Public list page sorted by relevance. Prisma cannot sort by "has
  // salary" or by completeness (they are computed expressions), so only the
  // ranking fields of the listings that pass the filter are fetched —the
  // live ones, a bounded set—, they are sorted here and only the requested
  // page is hydrated.
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
    // findMany with "in" does not keep the ids order: it is reordered here.
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

  // Poster rating (average and review count) to show on the list cards,
  // with a single grouped query per page.
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

  // Public detail: phones and location (with its reference) are only exposed
  // to signed-in users (business rule). Anonymous users see the rest (for
  // SEO); the department does stay visible as a general area.
  async findOnePublic(id: string, user: AuthUser | null) {
    const ad = await this.findOne(id);
    void this.traces.record(
      TraceType.AD_VIEWED,
      `Detalle del anuncio "${summary(ad.description)}" visto por ${user?.email ?? 'un visitante anónimo'}`,
      user,
      { resource: `ad:${id}` },
    );
    // The panel edits the priority from the listing form, so the admin does
    // get it in the detail; the rest of the portal does not.
    if (user?.isAdmin) return ad;
    if (user) return toPublicAd(ad);
    // toPublicAd already swaps the priority for `featured`; here we only also
    // strip the data that requires a session.
    const {
      phone: _phone,
      extraPhones: _extraPhones,
      location: _location,
      locationReference: _reference,
      latitude: _lat,
      longitude: _lng,
      ...publicAd
    } = toPublicAd(ad);
    return publicAd;
  }

  // Listing contact and location: require a session.
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
    // Anti-spam: the email must be verified before posting (admin exempt).
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
        ...stripAdminOnly(dto, user),
        durationDays,
        expiresAt: expiryDate(durationDays),
        createdById: user.id,
      },
      include: includeAuthor,
    });
    // Notifying subscribers must not break posting if it fails.
    try {
      await this.notifications.notifyNewAd(ad);
    } catch {
      /* noop: the notification is best-effort */
    }
    await this.traces.record(
      TraceType.AD_CREATED,
      `Anuncio "${summary(ad.description)}" publicado por ${ad.createdBy.email}`,
      ad.createdBy,
      { resource: `ad:${ad.id}` },
    );
    // Google indexes the listing while it is live (fire-and-forget).
    void this.indexing.notifyUpdated(ad.id);
    return toPublicAd(ad);
  }

  // Bulk import from the admin panel (CSV). Unlike create(): it does not
  // notify subscribers (that would trigger a burst of emails), it leaves a
  // single summary trace instead of one per listing, and the default
  // duration is 7 days (import rule).
  async bulkCreate(dtos: CreateAdDto[], user: AuthUser) {
    const now = new Date();
    const { count } = await this.prisma.ad.createMany({
      data: dtos.map((dto) => {
        const durationDays = dto.durationDays ?? 7;
        return {
          ...dto,
          // createMany builds an INSERT with the union of columns of the whole
          // batch: rows without extra phones would send an explicit NULL
          // instead of taking the default, and the column is NOT NULL.
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

    // Changing the duration extends the validity from now.
    const data: Prisma.AdUpdateInput = { ...stripAdminOnly(dto, user) };
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
    return toPublicAd(updated);
  }

  // Manual deactivation: the listing stops being publicly listed but is not deleted.
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
    return toPublicAd(updated);
  }

  // Reactivates a deactivated listing (or an expired one not yet swept by the
  // hourly cleanup) with a new validity window.
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
    return toPublicAd(updated);
  }

  // Hard delete: listing owner or admin.
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

  // Batch hard delete (admin panel). As in bulkCreate, a single summary
  // trace is left; indexing is notified per listing with the same cap as the
  // expired sweep to protect the API daily quota.
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

  // Hard delete of all listings (admin panel). Same as the batch delete: a
  // single summary trace and indexing notified per listing, capped at 100 to
  // protect the API daily quota.
  async removeAll(user: AuthUser, clientsOnly = false) {
    // clientsOnly: only client listings (panel report).
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

  // Own listings, with views and interested users to see their activity.
  async findMine(userId: string) {
    const ads = await this.prisma.ad.findMany({
      where: { createdById: userId },
      include: { ...includeAuthor, ...includeCounts },
      orderBy: { createdAt: 'desc' },
    });
    return ads.map(toPublicAd);
  }

  // Only the listing owner or an admin can modify or delete it.
  private assertCanModify(ownerId: string, user: AuthUser) {
    if (!user.isAdmin && user.id !== ownerId) {
      throw new ForbiddenException('No puedes modificar este anuncio');
    }
  }
}
