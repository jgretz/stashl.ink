import {google, type gmail_v1} from 'googleapis';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

export interface GmailMessage {
  id: string;
  subject: string;
  from: string;
  date: Date;
  htmlBody: string;
}

export interface TokenRefreshResult {
  accessToken: string;
  expiry: Date;
}

export class GmailClient {
  private oauth2Client;
  private gmail: gmail_v1.Gmail;

  constructor(accessToken: string, refreshToken: string) {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      throw new Error('Google OAuth credentials not configured');
    }

    this.oauth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);

    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    this.gmail = google.gmail({version: 'v1', auth: this.oauth2Client});
  }

  async refreshTokenIfNeeded(tokenExpiry: Date | null): Promise<TokenRefreshResult | null> {
    if (tokenExpiry && new Date() < tokenExpiry) {
      return null;
    }

    const {credentials} = await this.oauth2Client.refreshAccessToken();

    if (!credentials.access_token || !credentials.expiry_date) {
      throw new Error('Failed to refresh access token');
    }

    this.oauth2Client.setCredentials(credentials);

    return {
      accessToken: credentials.access_token,
      expiry: new Date(credentials.expiry_date),
    };
  }

  async listMessages(query: string): Promise<string[]> {
    const fullQuery = `${query} is:unread`;

    const response = await this.gmail.users.messages.list({
      userId: 'me',
      q: fullQuery,
      maxResults: 50,
    });

    return (response.data.messages || []).map((m) => m.id!).filter(Boolean);
  }

  async getMessage(messageId: string): Promise<GmailMessage> {
    const response = await this.gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });

    const message = response.data;
    const headers = message.payload?.headers || [];

    const getHeader = (name: string): string => {
      const header = headers.find((h) => h.name?.toLowerCase() === name.toLowerCase());
      return header?.value || '';
    };

    const subject = getHeader('Subject');
    const from = getHeader('From');
    const dateStr = getHeader('Date');
    const date = dateStr ? new Date(dateStr) : new Date();

    const htmlBody = this.extractHtmlBody(message.payload);

    return {
      id: messageId,
      subject,
      from,
      date,
      htmlBody,
    };
  }

  private extractHtmlBody(payload: gmail_v1.Schema$MessagePart | undefined): string {
    if (!payload) return '';

    if (payload.mimeType === 'text/html' && payload.body?.data) {
      return Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }

    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/html' && part.body?.data) {
          return Buffer.from(part.body.data, 'base64').toString('utf-8');
        }

        if (part.mimeType?.startsWith('multipart/')) {
          const nested = this.extractHtmlBody(part);
          if (nested) return nested;
        }
      }

      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          return Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
      }
    }

    if (payload.body?.data) {
      return Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }

    return '';
  }

  async markAsRead(messageId: string): Promise<void> {
    await this.gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        removeLabelIds: ['UNREAD'],
      },
    });
  }
}

export function extractEmailAddress(fromHeader: string): string {
  const match = fromHeader.match(/<([^>]+)>/);
  if (match) return match[1];

  if (fromHeader.includes('@')) return fromHeader.trim();

  return fromHeader;
}
