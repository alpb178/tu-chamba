import { Injectable, Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

// Notifies Google of ad additions/removals via the Indexing API (officially
// allowed for pages with JobPosting). Ads only live a few days: without this,
// the crawler usually arrives after the offer has already expired.
//
// Configured via environment (without it, the service is a no-op):
//   GOOGLE_INDEXING_CLIENT_EMAIL  service account with Search Console access
//   GOOGLE_INDEXING_PRIVATE_KEY   private key (the \n may come escaped)
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

  // Ad published, edited or republished.
  async notifyUpdated(adId: string) {
    await this.notify(adId, 'URL_UPDATED');
  }

  // Ad deleted or taken down: removed from the index.
  async notifyDeleted(adId: string) {
    await this.notify(adId, 'URL_DELETED');
  }

  // Best-effort: a failure (network, 429 quota) never breaks the main operation.
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
        // Public URLs carry the locale (/es, /en). Only the Spanish (default)
        // version is notified to save quota; Google finds the English one
        // through the page's hreflang alternates and the sitemap.
        body: JSON.stringify({ url: `${base}/es/listings/${adId}`, type }),
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

  // Service account OAuth token (JWT RS256), cached until it expires.
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
