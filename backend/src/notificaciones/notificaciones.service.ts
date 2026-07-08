import { Injectable, NotFoundException } from '@nestjs/common';
import { Anuncio, Review, Role, TipoNotificacion, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/decorators/current-user.decorator';

// Recorte para mensajes legibles en la campana de notificaciones.
function resumen(texto: string, max = 60) {
  return texto.length > max ? `${texto.slice(0, max - 1)}…` : texto;
}

@Injectable()
export class NotificacionesService {
  constructor(private prisma: PrismaService) {}

  // Listado propio + conteo de no leídas. Antes de listar se generan las
  // notificaciones de vencimiento pendientes (lazy, sin cron).
  async findMine(user: AuthUser) {
    await this.generarVencimientos(user.id);

    const [items, noLeidas] = await Promise.all([
      this.prisma.notificacion.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      this.prisma.notificacion.count({
        where: { userId: user.id, leida: false },
      }),
    ]);
    return { items, noLeidas };
  }

  async marcarLeida(id: string, userId: string) {
    const notif = await this.prisma.notificacion.findUnique({ where: { id } });
    if (!notif || notif.userId !== userId) {
      throw new NotFoundException('Notificación no encontrada');
    }
    return this.prisma.notificacion.update({
      where: { id },
      data: { leida: true },
    });
  }

  marcarTodasLeidas(userId: string) {
    return this.prisma.notificacion.updateMany({
      where: { userId, leida: false },
      data: { leida: true },
    });
  }

  // Alguien pulsó "Chatear": avisa al dueño del anuncio (salvo que sea él mismo).
  async chatClick(anuncioId: string, clicker: AuthUser) {
    const anuncio = await this.prisma.anuncio.findUnique({
      where: { id: anuncioId },
    });
    if (!anuncio) throw new NotFoundException('Anuncio no encontrado');
    if (anuncio.createdById === clicker.id) return { ok: true };

    const quien = await this.prisma.user.findUnique({
      where: { id: clicker.id },
      select: { nombre: true },
    });
    await this.prisma.notificacion.create({
      data: {
        tipo: TipoNotificacion.CHAT_INICIADO,
        mensaje: `${quien?.nombre ?? 'Alguien'} quiere chatear contigo por tu anuncio «${resumen(anuncio.descripcion)}»`,
        userId: anuncio.createdById,
        anuncioId: anuncio.id,
      },
    });
    return { ok: true };
  }

  // Nueva calificación recibida (la llama ReviewsService).
  async notificarReview(review: Review, autorNombre: string, esNueva: boolean) {
    await this.prisma.notificacion.create({
      data: {
        tipo: TipoNotificacion.NUEVA_REVIEW,
        mensaje: esNueva
          ? `${autorNombre} te calificó con ${review.rating}★: «${resumen(review.comentario)}»`
          : `${autorNombre} actualizó su calificación a ${review.rating}★`,
        userId: review.empleadorId,
      },
    });
  }

  // Anuncio nuevo publicado: avisa a todos los trabajadores (la llama AnunciosService).
  async notificarNuevoAnuncio(anuncio: Anuncio) {
    const trabajadores = await this.prisma.user.findMany({
      where: { role: Role.TRABAJADOR },
      select: { id: true },
    });
    if (!trabajadores.length) return;
    await this.prisma.notificacion.createMany({
      data: trabajadores.map((t) => ({
        tipo: TipoNotificacion.NUEVO_ANUNCIO,
        mensaje: `Nueva oferta${anuncio.ubicacion ? ` en ${anuncio.ubicacion}` : ''}: «${resumen(anuncio.descripcion)}»`,
        userId: t.id,
        anuncioId: anuncio.id,
      })),
    });
  }

  // Vencimientos: genera una notificación por anuncio ACTIVO ya expirado que
  // aún no fue notificado. El flag se resetea al republicar.
  private async generarVencimientos(userId: string) {
    const vencidos = await this.prisma.anuncio.findMany({
      where: {
        createdById: userId,
        estado: 'ACTIVO',
        expiraEn: { lt: new Date() },
        vencimientoNotificado: false,
      },
    });
    if (!vencidos.length) return;

    await this.prisma.$transaction([
      this.prisma.notificacion.createMany({
        data: vencidos.map((a) => ({
          tipo: TipoNotificacion.ANUNCIO_VENCIDO,
          mensaje: `Tu anuncio «${resumen(a.descripcion)}» venció. Puedes republicarlo desde Mis anuncios.`,
          userId,
          anuncioId: a.id,
        })),
      }),
      this.prisma.anuncio.updateMany({
        where: { id: { in: vencidos.map((a) => a.id) } },
        data: { vencimientoNotificado: true },
      }),
    ]);
  }
}
