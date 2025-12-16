import {resolveDependency} from '@stashl/iocdi';
import {REPOSITORY_SYMBOLS} from '../repositories';
import type {
  RssFeedRepository,
  RssFeedItemRepository,
  RssFeedImportHistoryRepository,
  RssFeed,
  RssFeedItem,
  RssFeedImportHistory,
  CreateRssFeedInput,
  UpdateRssFeedInput,
  CreateRssFeedItemInput,
  UpdateRssFeedItemInput,
} from '../types';

export class RssFeedService {
  private feedRepository: RssFeedRepository;
  private itemRepository: RssFeedItemRepository;
  private historyRepository: RssFeedImportHistoryRepository;

  constructor() {
    const feedRepo = resolveDependency<RssFeedRepository>(REPOSITORY_SYMBOLS.RSS_FEED_REPOSITORY);
    const itemRepo = resolveDependency<RssFeedItemRepository>(REPOSITORY_SYMBOLS.RSS_FEED_ITEM_REPOSITORY);
    const historyRepo = resolveDependency<RssFeedImportHistoryRepository>(REPOSITORY_SYMBOLS.RSS_FEED_IMPORT_HISTORY_REPOSITORY);

    if (!feedRepo || !itemRepo || !historyRepo) {
      throw new Error('RSS repositories not initialized. Call initializeRepositories() first.');
    }

    this.feedRepository = feedRepo;
    this.itemRepository = itemRepo;
    this.historyRepository = historyRepo;
  }

  async createFeed(input: CreateRssFeedInput, userId: string): Promise<RssFeed> {
    if (!input.feedUrl.trim()) {
      throw new Error('Feed URL cannot be empty');
    }
    if (!input.title.trim()) {
      throw new Error('Feed title cannot be empty');
    }

    const existing = await this.feedRepository.findByFeedUrl(input.feedUrl, userId);
    if (existing) {
      throw new Error('Feed already exists');
    }

    return await this.feedRepository.create(input, userId);
  }

  async getFeedById(id: string): Promise<RssFeed | null> {
    return await this.feedRepository.findById(id);
  }

  async getFeedsByUserId(userId: string): Promise<RssFeed[]> {
    return await this.feedRepository.findAllByUser(userId);
  }

  async getAllFeeds(): Promise<RssFeed[]> {
    return await this.feedRepository.findAll();
  }

  async updateFeed(id: string, input: UpdateRssFeedInput, userId: string): Promise<RssFeed | null> {
    const feed = await this.feedRepository.findById(id);
    if (!feed) {
      throw new Error('Feed not found');
    }
    if (feed.userId !== userId) {
      throw new Error('Unauthorized to update this feed');
    }
    return await this.feedRepository.update(id, input);
  }

  async deleteFeed(id: string, userId: string): Promise<boolean> {
    const feed = await this.feedRepository.findById(id);
    if (!feed) {
      throw new Error('Feed not found');
    }
    if (feed.userId !== userId) {
      throw new Error('Unauthorized to delete this feed');
    }
    return await this.feedRepository.delete(id);
  }

  async getItemsByFeedId(feedId: string, userId: string, limit?: number): Promise<RssFeedItem[]> {
    const feed = await this.feedRepository.findById(feedId);
    if (!feed) {
      throw new Error('Feed not found');
    }
    if (feed.userId !== userId) {
      throw new Error('Unauthorized to access this feed');
    }
    return await this.itemRepository.findByFeedId(feedId, limit);
  }

  async getUnreadItemsByUserId(userId: string, limit?: number): Promise<RssFeedItem[]> {
    const feeds = await this.feedRepository.findAllByUser(userId);
    const feedIds = feeds.map((f) => f.id);
    return await this.itemRepository.findUnreadByFeedIds(feedIds, limit);
  }

  async getItemById(id: string): Promise<RssFeedItem | null> {
    return await this.itemRepository.findById(id);
  }

  async updateItem(id: string, input: UpdateRssFeedItemInput, userId: string): Promise<RssFeedItem | null> {
    const item = await this.itemRepository.findById(id);
    if (!item) {
      throw new Error('Item not found');
    }
    const feed = await this.feedRepository.findById(item.feedId);
    if (!feed || feed.userId !== userId) {
      throw new Error('Unauthorized to update this item');
    }
    return await this.itemRepository.update(id, input);
  }

  async markAllAsRead(feedId: string, userId: string): Promise<number> {
    const feed = await this.feedRepository.findById(feedId);
    if (!feed) {
      throw new Error('Feed not found');
    }
    if (feed.userId !== userId) {
      throw new Error('Unauthorized to modify this feed');
    }
    return await this.itemRepository.markAllAsRead(feedId);
  }

  async markAllUnreadAsRead(userId: string): Promise<number> {
    const feeds = await this.feedRepository.findAllByUser(userId);
    const feedIds = feeds.map((f) => f.id);
    return await this.itemRepository.markAllAsReadByFeedIds(feedIds);
  }

  async importFeedItems(
    feedId: string,
    items: CreateRssFeedItemInput[],
  ): Promise<{newItems: RssFeedItem[]; skipped: number}> {
    const guids = items.map((i) => i.guid);
    const existingGuids = await this.itemRepository.findExistingGuids(feedId, guids);
    const existingSet = new Set(existingGuids);

    const newItemInputs = items.filter((i) => !existingSet.has(i.guid));
    const newItems = await this.itemRepository.createMany(newItemInputs);

    await this.historyRepository.create({
      feedId,
      itemCount: newItems.length,
      status: 'success',
    });

    return {newItems, skipped: existingGuids.length};
  }

  async getImportHistory(feedId: string, userId: string, limit?: number): Promise<RssFeedImportHistory[]> {
    const feed = await this.feedRepository.findById(feedId);
    if (!feed) {
      throw new Error('Feed not found');
    }
    if (feed.userId !== userId) {
      throw new Error('Unauthorized to access this feed');
    }
    return await this.historyRepository.findByFeedId(feedId, limit);
  }

  async recordImportError(feedId: string, errorMessage: string): Promise<void> {
    await this.historyRepository.create({
      feedId,
      itemCount: 0,
      status: 'error',
      errorMessage,
    });
  }

  async cleanupOldItems(feedId: string, daysOld = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    return await this.itemRepository.deleteOlderThan(feedId, cutoffDate);
  }
}
