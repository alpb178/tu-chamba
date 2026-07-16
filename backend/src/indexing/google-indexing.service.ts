import { Injectable, Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

// Notifica a Google los altas/bajas de anuncios vía Indexing API (permitida
// oficialmente para páginas con JobPosting). Los anuncios viven pocos días:
// sin esto, el crawler suele llegar cuando la oferta ya venció.
//
// Config por entorno (sin ella, el servicio es un no-op):
//   GOOGLE_INDEXING_CLIENT_EMAIL  service account con acceso en Search Console
//   GOOGLE_INDEXING_PRIVATE_KEY   clave privada (los \n pueden venir escapados)
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const PUBLISH_URL =
  'https://indexing.googleapis.com/v3/urlNotifications:publish';
const SCOPE = 'https://www.googleapis.com/auth/indexing';

@Injectable()
export class GoogleIndexingService {
  private readonly logger = new Logger(GoogleIndexingService.name);
  private token: { value: string; expiresAt: number } | null = null;

  private get clientEmail() {
    return process.env.GOOGLE_INDEXING_CLIENT_EMAIL;
  }

  private get privateKey() {
    return process.env.GOOGLE_INDEXING_PRIVATE_KEY?.replace(/\\n/g, '\n');
  }

  get enabled(): boolean {
    return Boolean(this.clientEmail && this.privateKey);
  }

  // Anuncio publicado, editado o republicado.
  async notifyUpdated(adId: string) {
    await this.notify(adId, 'URL_UPDATED');
  }

  // Anuncio eliminado o dado de baja: sale del índice.
  async notifyDeleted(adId: string) {
    await this.notify(adId, 'URL_DELETED');
  }

  // Best-effort: un fallo (red, cuota 429) jamás rompe la operación principal.
  private async notify(adId: string, type: 'URL_UPDATED' | 'URL_DELETED') {
    if (!this.enabled) return;
    const base = process.env.WEB_URL ?? 'https://tu-chamba.corpsc.com';
    try {
      const res = await fetch(PUBLISH_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${await this.accessToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: `${base}/listings/${adId}`, type }),
      });
      if (!res.ok) {
        this.logger.warn(
          `Indexing API ${type} para ${adId}: HTTP ${res.status}`,
        );
      }
    } catch (e) {
      this.logger.warn(`Indexing API ${type} para ${adId}: ${(e as Error).message}`);
    }
  }

  // Token OAuth del service account (JWT RS256), cacheado hasta su expiración.
  private async accessToken(): Promise<string> {
    if (this.token && Date.now() < this.token.expiresAt - 60_000) {
      return this.token.value;
    }
    const now = Math.floor(Date.now() / 1000);
    const assertion = jwt.sign(
      {
        iss: this.clientEmail,
        scope: SCOPE,
        aud: TOKEN_URL,
        iat: now,
        exp: now + 3600,
      },
      this.privateKey!,
      { algorithm: 'RS256' },
    );
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
      }),
    });
    if (!res.ok) throw new Error(`token HTTP ${res.status}`);
    const data = (await res.json()) as { access_token: string; expires_in: number };
    this.token = {
      value: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
    return this.token.value;
  }
}
