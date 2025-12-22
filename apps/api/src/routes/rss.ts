import {Hono} from 'hono';
import {RssFeedService} from '@stashl/domain/src/services/rssFeed.service';
import {sendTaskMessage} from '../taskSocket';

export const rssRoutes = new Hono();

// GET /api/rss/feeds - Get all user's feeds with last import date
rssRoutes.get('/feeds', async (c) => {
  try {
    const {userId} = c.get('user');
    const service = new RssFeedService();
    const feeds = await service.getFeedsWithLastImportByUserId(userId);
    return c.json({feeds});
  } catch (error) {
    throw error;
  }
});

// GET /api/rss/feeds/all - Get all feeds (all users) - Task runner endpoint
// Must be defined before /feeds/:id to avoid :id capturing "all"
rssRoutes.get('/feeds/all', async (c) => {
  try {
    const service = new RssFeedService();
    const feeds = await service.getAllFeeds();
    return c.json({feeds});
  } catch (error) {
    console.error('Error fetching all feeds:', error);
    return c.json({error: 'Failed to fetch feeds'}, 500);
  }
});

// GET /api/rss/feeds/:id - Get single feed
rssRoutes.get('/feeds/:id', async (c) => {
  try {
    const {userId} = c.get('user');
    const feedId = c.req.param('id');
    const service = new RssFeedService();
    const feed = await service.getFeedById(feedId);

    if (!feed) {
      return c.json({error: 'Feed not found'}, 404);
    }
    if (feed.userId !== userId) {
      return c.json({error: 'Unauthorized'}, 403);
    }

    return c.json({feed});
  } catch (error) {
    throw error;
  }
});

// POST /api/rss/feeds - Create new feed
rssRoutes.post('/feeds', async (c) => {
  try {
    const {userId} = c.get('user');
    const body = await c.req.json();
    const {title, feedUrl, siteUrl} = body;

    if (!title || !feedUrl) {
      return c.json({error: 'Title and feedUrl are required'}, 400);
    }

    const service = new RssFeedService();
    const feed = await service.createFeed({title, feedUrl, siteUrl}, userId);
    return c.json({message: 'Feed created', feed}, 201);
  } catch (error) {
    throw error;
  }
});

// PUT /api/rss/feeds/:id - Update feed
rssRoutes.put('/feeds/:id', async (c) => {
  try {
    const {userId} = c.get('user');
    const feedId = c.req.param('id');
    const body = await c.req.json();

    const service = new RssFeedService();
    const feed = await service.updateFeed(feedId, body, userId);
    return c.json({message: 'Feed updated', feed});
  } catch (error) {
    throw error;
  }
});

// DELETE /api/rss/feeds/:id - Delete feed
rssRoutes.delete('/feeds/:id', async (c) => {
  try {
    const {userId} = c.get('user');
    const feedId = c.req.param('id');

    const service = new RssFeedService();
    await service.deleteFeed(feedId, userId);
    return c.json({message: 'Feed deleted'});
  } catch (error) {
    throw error;
  }
});

// GET /api/rss/items/unread - Get all unread items across all user's feeds
rssRoutes.get('/items/unread', async (c) => {
  try {
    const {userId} = c.get('user');
    const limit = parseInt(c.req.query('limit') || '100');
    const offset = parseInt(c.req.query('offset') || '0');

    const service = new RssFeedService();
    const items = await service.getUnreadItemsWithFeedTitleByUserId(userId, limit, offset);
    const hasMore = items.length === limit;
    return c.json({items, hasMore, nextOffset: offset + items.length});
  } catch (error) {
    throw error;
  }
});

// POST /api/rss/items/mark-all-read - Mark all unread items as read across all feeds
rssRoutes.post('/items/mark-all-read', async (c) => {
  try {
    const {userId} = c.get('user');

    const service = new RssFeedService();
    const count = await service.markAllUnreadAsRead(userId);
    return c.json({message: `Marked ${count} items as read`, count});
  } catch (error) {
    throw error;
  }
});

// GET /api/rss/feeds/:id/items - Get feed items
rssRoutes.get('/feeds/:id/items', async (c) => {
  try {
    const {userId} = c.get('user');
    const feedId = c.req.param('id');
    const limit = parseInt(c.req.query('limit') || '50');

    const service = new RssFeedService();
    const items = await service.getItemsByFeedId(feedId, userId, limit);
    return c.json({items});
  } catch (error) {
    throw error;
  }
});

// PUT /api/rss/items/:id - Update item (mark read/clicked)
rssRoutes.put('/items/:id', async (c) => {
  try {
    const {userId} = c.get('user');
    const itemId = c.req.param('id');
    const body = await c.req.json();

    const service = new RssFeedService();
    const item = await service.updateItem(itemId, body, userId);
    return c.json({item});
  } catch (error) {
    throw error;
  }
});

// POST /api/rss/feeds/:id/mark-all-read - Mark all items as read
rssRoutes.post('/feeds/:id/mark-all-read', async (c) => {
  try {
    const {userId} = c.get('user');
    const feedId = c.req.param('id');

    const service = new RssFeedService();
    const count = await service.markAllAsRead(feedId, userId);
    return c.json({message: `Marked ${count} items as read`, count});
  } catch (error) {
    throw error;
  }
});

// GET /api/rss/feeds/:id/history - Get import history
rssRoutes.get('/feeds/:id/history', async (c) => {
  try {
    const {userId} = c.get('user');
    const feedId = c.req.param('id');
    const limit = parseInt(c.req.query('limit') || '10');

    const service = new RssFeedService();
    const history = await service.getImportHistory(feedId, userId, limit);
    return c.json({history});
  } catch (error) {
    throw error;
  }
});

// POST /api/rss/feeds/import-all - Trigger import for all user's feeds
rssRoutes.post('/feeds/import-all', async (c) => {
  try {
    const {userId} = c.get('user');

    const service = new RssFeedService();
    const feeds = await service.getFeedsByUserId(userId);

    if (feeds.length === 0) {
      return c.json({message: 'No feeds to import', count: 0});
    }

    const sent = sendTaskMessage({
      type: 'import-all-feeds',
      payload: {feeds: feeds.map((f) => ({feedId: f.id, feedUrl: f.feedUrl}))},
    });
    if (sent) {
      return c.json({message: `Queued ${feeds.length} feed imports`, count: feeds.length});
    } else {
      return c.json({error: 'Task service not connected'}, 503);
    }
  } catch (error) {
    throw error;
  }
});

// POST /api/rss/feeds/:id/import - Trigger manual import
rssRoutes.post('/feeds/:id/import', async (c) => {
  try {
    const {userId} = c.get('user');
    const feedId = c.req.param('id');

    const service = new RssFeedService();
    const feed = await service.getFeedById(feedId);

    if (!feed) {
      return c.json({error: 'Feed not found'}, 404);
    }
    if (feed.userId !== userId) {
      return c.json({error: 'Unauthorized'}, 403);
    }

    const sent = sendTaskMessage({
      type: 'import-feed',
      payload: {feedId, feedUrl: feed.feedUrl},
    });
    if (sent) {
      return c.json({message: 'Import queued', feedId});
    } else {
      return c.json({error: 'Task service not connected'}, 503);
    }
  } catch (error) {
    throw error;
  }
});

// ============================================================================
// Task runner endpoints (X-Task-Key auth)
// Note: /feeds/all is defined earlier to avoid route conflicts with /feeds/:id
// ============================================================================

// POST /api/rss/feeds/:feedId/items - Batch import feed items
rssRoutes.post('/feeds/:feedId/items', async (c) => {
  try {
    const feedId = c.req.param('feedId');
    const {items} = await c.req.json();

    if (!Array.isArray(items)) {
      return c.json({error: 'items must be an array'}, 400);
    }

    const itemsWithDates = items.map((item: any) => ({
      feedId,
      guid: item.guid,
      title: item.title,
      link: item.link,
      summary: item.summary,
      content: item.content,
      imageUrl: item.imageUrl,
      pubDate: item.pubDate ? new Date(item.pubDate) : undefined,
    }));

    const service = new RssFeedService();
    const result = await service.importFeedItems(feedId, itemsWithDates);

    return c.json({
      newItems: result.newItems.length,
      skipped: result.skipped,
    });
  } catch (error) {
    console.error('Error importing feed items:', error);
    return c.json({error: 'Failed to import feed items'}, 500);
  }
});

// POST /api/rss/feeds/:feedId/error - Record import error
rssRoutes.post('/feeds/:feedId/error', async (c) => {
  try {
    const feedId = c.req.param('feedId');
    const {errorMessage} = await c.req.json();

    if (typeof errorMessage !== 'string') {
      return c.json({error: 'errorMessage is required'}, 400);
    }

    const service = new RssFeedService();
    await service.recordImportError(feedId, errorMessage);

    return c.json({recorded: true});
  } catch (error) {
    console.error('Error recording import error:', error);
    return c.json({error: 'Failed to record import error'}, 500);
  }
});

// DELETE /api/rss/feeds/:feedId/cleanup - Delete old feed items
rssRoutes.delete('/feeds/:feedId/cleanup', async (c) => {
  try {
    const feedId = c.req.param('feedId');
    const body = await c.req.json().catch(() => ({}));
    const daysOld = body.daysOld ?? 30;

    const service = new RssFeedService();
    const deleted = await service.cleanupOldItems(feedId, daysOld);

    return c.json({deleted});
  } catch (error) {
    console.error('Error cleaning up feed items:', error);
    return c.json({error: 'Failed to cleanup feed items'}, 500);
  }
});
