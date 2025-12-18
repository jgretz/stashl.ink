import {Hono} from 'hono';
import {google} from 'googleapis';
import {EmailService} from '@stashl/domain/src/services/email.service';

export const emailRoutes = new Hono();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.modify'];

function getOAuth2Client() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth credentials not configured');
  }
  return new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
}

// GET /api/email/settings - Get email integration settings
emailRoutes.get('/settings', async (c) => {
  try {
    const {userId} = c.get('user');
    const service = new EmailService();
    const settings = await service.getEmailSettings(userId);

    if (!settings) {
      return c.json({error: 'User not found'}, 404);
    }

    return c.json(settings);
  } catch (error) {
    throw error;
  }
});

// PUT /api/email/settings - Update email settings (filter only, emailIntegrationEnabled is admin-only)
emailRoutes.put('/settings', async (c) => {
  try {
    const {userId} = c.get('user');
    const body = await c.req.json();
    const {emailFilter} = body;

    const service = new EmailService();

    if (typeof emailFilter === 'string') {
      await service.updateEmailFilter(userId, emailFilter);
    }

    const settings = await service.getEmailSettings(userId);
    return c.json(settings);
  } catch (error) {
    throw error;
  }
});

// POST /api/email/disconnect - Disconnect Gmail
emailRoutes.post('/disconnect', async (c) => {
  try {
    const {userId} = c.get('user');
    const service = new EmailService();
    await service.clearGmailTokens(userId);
    return c.json({message: 'Gmail disconnected'});
  } catch (error) {
    throw error;
  }
});

// GET /api/email/oauth/url - Get OAuth authorization URL
emailRoutes.get('/oauth/url', async (c) => {
  try {
    const {userId} = c.get('user');
    const oauth2Client = getOAuth2Client();

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent',
      state: userId,
    });

    return c.json({authUrl});
  } catch (error) {
    throw error;
  }
});

// GET /api/email/oauth/callback - Handle OAuth callback
emailRoutes.get('/oauth/callback', async (c) => {
  try {
    const code = c.req.query('code');
    const state = c.req.query('state');

    if (!code || !state) {
      return c.json({error: 'Missing code or state'}, 400);
    }

    const userId = state;
    const oauth2Client = getOAuth2Client();

    const {tokens} = await oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      return c.json({error: 'Failed to get tokens'}, 400);
    }

    const service = new EmailService();
    await service.saveGmailTokens(userId, {
      gmailAccessToken: tokens.access_token,
      gmailRefreshToken: tokens.refresh_token,
      gmailTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600 * 1000),
    });

    const redirectUrl = process.env.WEB_URL || 'http://localhost:3000';
    return c.redirect(`${redirectUrl}/settings?gmail=connected`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    const redirectUrl = process.env.WEB_URL || 'http://localhost:3000';
    return c.redirect(`${redirectUrl}/settings?gmail=error`);
  }
});

// GET /api/email/items - Get all email items
emailRoutes.get('/items', async (c) => {
  try {
    const {userId} = c.get('user');
    const limit = parseInt(c.req.query('limit') || '100');
    const offset = parseInt(c.req.query('offset') || '0');

    const service = new EmailService();
    const items = await service.getItemsByUserId(userId, limit, offset);
    const hasMore = items.length === limit;

    return c.json({items, hasMore, nextOffset: offset + items.length});
  } catch (error) {
    throw error;
  }
});

// GET /api/email/items/unread - Get unread email items
emailRoutes.get('/items/unread', async (c) => {
  try {
    const {userId} = c.get('user');
    const limit = parseInt(c.req.query('limit') || '100');
    const offset = parseInt(c.req.query('offset') || '0');

    const service = new EmailService();
    const items = await service.getUnreadItems(userId, limit, offset);
    const hasMore = items.length === limit;

    return c.json({items, hasMore, nextOffset: offset + items.length});
  } catch (error) {
    throw error;
  }
});

// PUT /api/email/items/:id - Update email item
emailRoutes.put('/items/:id', async (c) => {
  try {
    const {userId} = c.get('user');
    const itemId = c.req.param('id');
    const body = await c.req.json();

    const service = new EmailService();
    const item = await service.updateItem(itemId, body, userId);

    return c.json({item});
  } catch (error) {
    throw error;
  }
});

// POST /api/email/items/mark-all-read - Mark all items as read
emailRoutes.post('/items/mark-all-read', async (c) => {
  try {
    const {userId} = c.get('user');

    const service = new EmailService();
    const count = await service.markAllAsRead(userId);

    return c.json({message: `Marked ${count} items as read`, count});
  } catch (error) {
    throw error;
  }
});

// POST /api/email/refresh - Trigger email import
emailRoutes.post('/refresh', async (c) => {
  try {
    const {getJobQueue} = await import('../jobQueue');
    const boss = getJobQueue();
    if (boss) {
      await boss.send('import-emails', {});
      return c.json({message: 'Email import queued'});
    } else {
      return c.json({error: 'Job queue not available'}, 503);
    }
  } catch (error) {
    throw error;
  }
});
