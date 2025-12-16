import {Hono} from 'hono';
import {RssFeedService} from '@stashl/domain/src/services/rssFeed.service';

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

    const {getJobQueue} = await import('../jobQueue');
    const boss = getJobQueue();
    if (boss) {
      for (const feed of feeds) {
        await boss.send('import-feed', {feedId: feed.id, feedUrl: feed.feedUrl});
      }
      return c.json({message: `Queued ${feeds.length} feed imports`, count: feeds.length});
    } else {
      return c.json({error: 'Job queue not available'}, 503);
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

    // Queue import task via pg-boss
    const {getJobQueue} = await import('../jobQueue');
    const boss = getJobQueue();
    if (boss) {
      await boss.send('import-feed', {feedId, feedUrl: feed.feedUrl});
      return c.json({message: 'Import queued', feedId});
    } else {
      return c.json({error: 'Job queue not available'}, 503);
    }
  } catch (error) {
    throw error;
  }
});
