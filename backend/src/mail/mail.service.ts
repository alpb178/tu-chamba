import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

// Email sending. Uses SMTP if configured (SMTP_HOST/PORT/USER/PASS);
// otherwise logs the content to the console (handy in dev, no provider).
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

  // Service status for the Site Activity panel:
  // no SMTP configured -> 'warning'; with SMTP the connection is verified.
  async healthCheck(): Promise<'up' | 'warning' | 'down'> {
    if (!this.transporter) return 'warning';
    try {
      // verify() opens the SMTP connection; capped so it doesn't hang the panel.
      await Promise.race([
        this.transporter.verify(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 4000),
        ),
      ]);
      return 'up';
    } catch {
      return 'down';
    }
  }

  async send(to: string, subject: string, html: string) {
    if (!this.transporter) {
      // Development fallback: without SMTP, we leave the email in the log.
      this.logger.warn(
        `SMTP no configurado. Correo para ${to} — ${subject}\n${html}`,
      );
      return;
    }
    await this.transporter.sendMail({ from: this.from, to, subject, html });
  }

  async sendPasswordReset(to: string, name: string, link: string) {
    const html = `
      <p>Hola ${name},</p>
      <p>Recibimos un pedido para restablecer tu contraseña de <strong>Tu Chamba</strong>:</p>
      <p><a href="${link}" style="background:#004ac6;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">Restablecer mi contraseña</a></p>
      <p>O copia este enlace: ${link}</p>
      <p>El enlace vence en 1 hora. Si no fuiste tú, ignora este correo.</p>`;
    await this.send(to, 'Restablece tu contraseña — Tu Chamba', html);
  }

  async sendVerification(to: string, name: string, link: string) {
    const html = `
      <p>Hola ${name},</p>
      <p>Gracias por registrarte en <strong>Tu Chamba</strong>. Confirma tu correo para activar tu cuenta:</p>
      <p><a href="${link}" style="background:#102136;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">Verificar mi correo</a></p>
      <p>O copia este enlace: ${link}</p>
      <p>El enlace vence en 24 horas.</p>`;
    await this.send(to, 'Verifica tu correo — Tu Chamba', html);
  }
}
