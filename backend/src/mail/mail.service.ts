import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

// Envío de correo. Usa SMTP si está configurado (SMTP_HOST/PORT/USER/PASS);
// si no, registra el contenido en consola (útil en desarrollo, sin proveedor).
@Injectable()
export class MailService {
  private readonly logger = new Logger('MailService');
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
    if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT ?? 587),
        secure: Number(SMTP_PORT ?? 587) === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      });
    }
  }

  private get from() {
    return process.env.SMTP_FROM ?? 'Tu Chamba <no-reply@tuchamba.com>';
  }

  async send(to: string, subject: string, html: string) {
    if (!this.transporter) {
      // Fallback de desarrollo: sin SMTP, dejamos el correo en el log.
      this.logger.warn(
        `SMTP no configurado. Correo para ${to} — ${subject}\n${html}`,
      );
      return;
    }
    await this.transporter.sendMail({ from: this.from, to, subject, html });
  }

  async sendVerification(to: string, nombre: string, link: string) {
    const html = `
      <p>Hola ${nombre},</p>
      <p>Gracias por registrarte en <strong>Tu Chamba</strong>. Confirma tu correo para activar tu cuenta:</p>
      <p><a href="${link}" style="background:#102136;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">Verificar mi correo</a></p>
      <p>O copia este enlace: ${link}</p>
      <p>El enlace vence en 24 horas.</p>`;
    await this.send(to, 'Verifica tu correo — Tu Chamba', html);
  }
}
