import {Hono} from 'hono';
import {google} from 'googleapis';
import {EmailService} from '@stashl/domain/src/services/email.service';
import {UserService} from '@stashl/domain/src/services/user.service';
import {sendTaskMessage} from '../taskSocket';

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

// POST /api/email/refresh - Trigger email import for current user
emailRoutes.post('/refresh', async (c) => {
  try {
    const {userId} = c.get('user');
    const sent = sendTaskMessage({
      type: 'import-emails',
      payload: {userId},
    });
    if (sent) {
      return c.json({message: 'Email import queued'});
    } else {
      return c.json({error: 'Task service not connected'}, 503);
    }
  } catch (error) {
    throw error;
  }
});

// ============================================================================
// Task runner endpoints (X-Task-Key auth)
// ============================================================================

// GET /api/email/users/enabled - Get users with email enabled
emailRoutes.get('/users/enabled', async (c) => {
  try {
    const service = new EmailService();
    const users = await service.getUsersWithEmailEnabled();

    const sanitizedUsers = users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      emailIntegrationEnabled: u.emailIntegrationEnabled,
      emailFilter: u.emailFilter,
      gmailAccessToken: u.gmailAccessToken,
      gmailRefreshToken: u.gmailRefreshToken,
      gmailTokenExpiry: u.gmailTokenExpiry?.toISOString() ?? null,
    }));

    return c.json({users: sanitizedUsers});
  } catch (error) {
    console.error('Error fetching email users:', error);
    return c.json({error: 'Failed to fetch email users'}, 500);
  }
});

// GET /api/email/users/:userId - Get user by ID (for task runner)
emailRoutes.get('/users/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const service = new UserService();
    const user = await service.getUserById(userId);

    if (!user) {
      return c.json({user: null});
    }

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailIntegrationEnabled: user.emailIntegrationEnabled,
        emailFilter: user.emailFilter,
        gmailAccessToken: user.gmailAccessToken,
        gmailRefreshToken: user.gmailRefreshToken,
        gmailTokenExpiry: user.gmailTokenExpiry?.toISOString() ?? null,
      },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return c.json({error: 'Failed to fetch user'}, 500);
  }
});

// PUT /api/email/users/:userId/gmail-tokens - Save Gmail tokens
emailRoutes.put('/users/:userId/gmail-tokens', async (c) => {
  try {
    const userId = c.req.param('userId');
    const {gmailAccessToken, gmailRefreshToken, gmailTokenExpiry} = await c.req.json();

    if (!gmailAccessToken || !gmailRefreshToken || !gmailTokenExpiry) {
      return c.json({error: 'gmailAccessToken, gmailRefreshToken, and gmailTokenExpiry are required'}, 400);
    }

    const service = new EmailService();
    await service.saveGmailTokens(userId, {
      gmailAccessToken,
      gmailRefreshToken,
      gmailTokenExpiry: new Date(gmailTokenExpiry),
    });

    return c.json({updated: true});
  } catch (error) {
    console.error('Error saving gmail tokens:', error);
    return c.json({error: 'Failed to save gmail tokens'}, 500);
  }
});

// POST /api/email/users/:userId/items - Batch import email items
emailRoutes.post('/users/:userId/items', async (c) => {
  try {
    const userId = c.req.param('userId');
    const {items} = await c.req.json();

    if (!Array.isArray(items)) {
      return c.json({error: 'items must be an array'}, 400);
    }

    const service = new EmailService();
    const result = await service.importEmailItems(userId, items);

    return c.json({
      newItems: result.newItems.length,
      skipped: result.skipped,
    });
  } catch (error) {
    console.error('Error importing email items:', error);
    return c.json({error: 'Failed to import email items'}, 500);
  }
});

// DELETE /api/email/users/:userId/cleanup - Delete old email items
emailRoutes.delete('/users/:userId/cleanup', async (c) => {
  try {
    const userId = c.req.param('userId');
    const body = await c.req.json().catch(() => ({}));
    const daysOld = body.daysOld ?? 30;

    const service = new EmailService();
    const deleted = await service.cleanupOldItems(userId, daysOld);

    return c.json({deleted});
  } catch (error) {
    console.error('Error cleaning up email items:', error);
    return c.json({error: 'Failed to cleanup email items'}, 500);
  }
});
