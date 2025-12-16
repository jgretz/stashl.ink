import type {
  User as DbUser,
  Link as DbLink,
  RssFeed as DbRssFeed,
  RssFeedItem as DbRssFeedItem,
  RssFeedImportHistory as DbRssFeedImportHistory,
} from './db/schema';

export type User = DbUser;
export type Link = DbLink;

export interface CreateLinkInput {
  url: string;
  title: string;
  description?: string;
}

export interface UpdateLinkInput {
  url?: string;
  title?: string;
  description?: string;
}

export interface LinkRepository {
  create(input: CreateLinkInput, userId: string): Promise<Link>;
  findById(id: string): Promise<Link | null>;
  findAllByUser(userId: string): Promise<Link[]>;
  findAll(): Promise<Link[]>;
  update(id: string, input: UpdateLinkInput): Promise<Link | null>;
  delete(id: string): Promise<boolean>;
}

export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
}

export interface UpdateUserInput {
  email?: string;
  name?: string;
  password?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: Omit<User, 'password'>;
}

export interface UserRepository {
  create(input: CreateUserInput): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  update(id: string, input: UpdateUserInput): Promise<User | null>;
  delete(id: string): Promise<boolean>;
  setResetToken(email: string, token: string, expiry: Date): Promise<boolean>;
  findByResetToken(token: string): Promise<User | null>;
  clearResetToken(id: string): Promise<boolean>;
}

export type RssFeed = DbRssFeed;
export type RssFeedItem = DbRssFeedItem;
export type RssFeedImportHistory = DbRssFeedImportHistory;

export interface CreateRssFeedInput {
  title: string;
  feedUrl: string;
  siteUrl?: string;
}

export interface UpdateRssFeedInput {
  title?: string;
  feedUrl?: string;
  siteUrl?: string;
}

export interface CreateRssFeedItemInput {
  feedId: string;
  guid: string;
  title: string;
  link: string;
  summary?: string;
  content?: string;
  imageUrl?: string;
  pubDate?: Date;
}

export interface UpdateRssFeedItemInput {
  read?: boolean;
  clicked?: boolean;
}

export interface CreateImportHistoryInput {
  feedId: string;
  itemCount: number;
  status: 'success' | 'error' | 'partial';
  errorMessage?: string;
}

export interface RssFeedRepository {
  create(input: CreateRssFeedInput, userId: string): Promise<RssFeed>;
  findById(id: string): Promise<RssFeed | null>;
  findAllByUser(userId: string): Promise<RssFeed[]>;
  findByFeedUrl(feedUrl: string, userId: string): Promise<RssFeed | null>;
  findAll(): Promise<RssFeed[]>;
  update(id: string, input: UpdateRssFeedInput): Promise<RssFeed | null>;
  delete(id: string): Promise<boolean>;
}

export interface RssFeedItemRepository {
  create(input: CreateRssFeedItemInput): Promise<RssFeedItem>;
  createMany(inputs: CreateRssFeedItemInput[]): Promise<RssFeedItem[]>;
  findById(id: string): Promise<RssFeedItem | null>;
  findByFeedId(feedId: string, limit?: number): Promise<RssFeedItem[]>;
  findByGuid(feedId: string, guid: string): Promise<RssFeedItem | null>;
  findExistingGuids(feedId: string, guids: string[]): Promise<string[]>;
  findUnreadByFeedIds(feedIds: string[], limit?: number, offset?: number): Promise<RssFeedItem[]>;
  update(id: string, input: UpdateRssFeedItemInput): Promise<RssFeedItem | null>;
  delete(id: string): Promise<boolean>;
  deleteOlderThan(feedId: string, date: Date): Promise<number>;
  markAllAsRead(feedId: string): Promise<number>;
  markAllAsReadByFeedIds(feedIds: string[]): Promise<number>;
}

export interface RssFeedImportHistoryRepository {
  create(input: CreateImportHistoryInput): Promise<RssFeedImportHistory>;
  findByFeedId(feedId: string, limit?: number): Promise<RssFeedImportHistory[]>;
  getLatestForFeed(feedId: string): Promise<RssFeedImportHistory | null>;
  getLatestSuccessfulForFeed(feedId: string): Promise<RssFeedImportHistory | null>;
}