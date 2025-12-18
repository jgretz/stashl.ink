import {resolveDependency} from '@stashl/iocdi';
import {REPOSITORY_SYMBOLS} from '../repositories';
import type {
  UserRepository,
  EmailItemRepository,
  User,
  EmailItem,
  CreateEmailItemInput,
  UpdateEmailItemInput,
  UpdateGmailTokensInput,
} from '../types';

export class EmailService {
  private userRepository: UserRepository;
  private emailItemRepository: EmailItemRepository;

  constructor() {
    const userRepo = resolveDependency<UserRepository>(REPOSITORY_SYMBOLS.USER_REPOSITORY);
    const emailItemRepo = resolveDependency<EmailItemRepository>(REPOSITORY_SYMBOLS.EMAIL_ITEM_REPOSITORY);

    if (!userRepo || !emailItemRepo) {
      throw new Error('Repositories not initialized. Call initializeRepositories() first.');
    }

    this.userRepository = userRepo;
    this.emailItemRepository = emailItemRepo;
  }

  async enableEmailIntegration(userId: string): Promise<User | null> {
    return await this.userRepository.update(userId, {emailIntegrationEnabled: true});
  }

  async disableEmailIntegration(userId: string): Promise<User | null> {
    return await this.userRepository.update(userId, {emailIntegrationEnabled: false});
  }

  async updateEmailFilter(userId: string, filter: string): Promise<User | null> {
    return await this.userRepository.update(userId, {emailFilter: filter});
  }

  async saveGmailTokens(userId: string, tokens: UpdateGmailTokensInput): Promise<User | null> {
    return await this.userRepository.updateGmailTokens(userId, tokens);
  }

  async clearGmailTokens(userId: string): Promise<User | null> {
    return await this.userRepository.clearGmailTokens(userId);
  }

  async getUsersWithEmailEnabled(): Promise<User[]> {
    return await this.userRepository.findAllWithEmailEnabled();
  }

  async getEmailSettings(userId: string): Promise<{
    emailIntegrationEnabled: boolean;
    emailFilter: string | null;
    isConnected: boolean;
  } | null> {
    const user = await this.userRepository.findById(userId);
    if (!user) return null;

    return {
      emailIntegrationEnabled: user.emailIntegrationEnabled,
      emailFilter: user.emailFilter,
      isConnected: !!(user.gmailAccessToken && user.gmailRefreshToken),
    };
  }

  async importEmailItems(
    userId: string,
    items: Omit<CreateEmailItemInput, 'userId'>[],
  ): Promise<{newItems: EmailItem[]; skipped: number}> {
    if (items.length === 0) return {newItems: [], skipped: 0};

    const emailMessageIds = [...new Set(items.map((i) => i.emailMessageId))];
    const allLinks = items.map((i) => i.link);

    let existingLinks: string[] = [];
    for (const messageId of emailMessageIds) {
      const linksForMessage = items.filter((i) => i.emailMessageId === messageId).map((i) => i.link);
      const existing = await this.emailItemRepository.findExistingLinks(userId, messageId, linksForMessage);
      existingLinks = [...existingLinks, ...existing];
    }

    const existingSet = new Set(existingLinks);
    const newItemInputs = items
      .filter((i) => !existingSet.has(i.link))
      .map((i) => ({...i, userId}));

    const newItems = await this.emailItemRepository.createMany(newItemInputs);

    return {newItems, skipped: items.length - newItemInputs.length};
  }

  async getItemsByUserId(userId: string, limit?: number, offset?: number): Promise<EmailItem[]> {
    return await this.emailItemRepository.findByUserId(userId, limit, offset);
  }

  async getUnreadItems(userId: string, limit?: number, offset?: number): Promise<EmailItem[]> {
    return await this.emailItemRepository.findUnreadByUserId(userId, limit, offset);
  }

  async getItemById(id: string): Promise<EmailItem | null> {
    return await this.emailItemRepository.findById(id);
  }

  async updateItem(id: string, input: UpdateEmailItemInput, userId: string): Promise<EmailItem | null> {
    const item = await this.emailItemRepository.findById(id);
    if (!item) {
      throw new Error('Item not found');
    }
    if (item.userId !== userId) {
      throw new Error('Unauthorized to update this item');
    }
    return await this.emailItemRepository.update(id, input);
  }

  async markItemAsRead(id: string, userId: string): Promise<EmailItem | null> {
    return await this.updateItem(id, {read: true}, userId);
  }

  async markItemAsClicked(id: string, userId: string): Promise<EmailItem | null> {
    return await this.updateItem(id, {clicked: true}, userId);
  }

  async markAllAsRead(userId: string): Promise<number> {
    return await this.emailItemRepository.markAllAsRead(userId);
  }

  async cleanupOldItems(userId: string, daysOld = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    return await this.emailItemRepository.deleteOlderThan(userId, cutoffDate);
  }
}
