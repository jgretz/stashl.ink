import {pgTable, text, timestamp, uuid, varchar, index, boolean, integer, jsonb, uniqueIndex} from 'drizzle-orm/pg-core';
import {relations} from 'drizzle-orm';

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', {length: 255}).notNull().unique(),
    name: varchar('name', {length: 255}).notNull(),
    password: text('password').notNull(),
    resetToken: text('reset_token'),
    resetTokenExpiry: timestamp('reset_token_expiry'),
    emailIntegrationEnabled: boolean('email_integration_enabled').default(false).notNull(),
    emailFilter: varchar('email_filter', {length: 500}),
    gmailAccessToken: text('gmail_access_token'),
    gmailRefreshToken: text('gmail_refresh_token'),
    gmailTokenExpiry: timestamp('gmail_token_expiry'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('users_email_idx').on(table.email),
    index('users_reset_token_idx').on(table.resetToken),
  ],
);

export const links = pgTable(
  'links',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    url: text('url').notNull(),
    title: varchar('title', {length: 500}).notNull(),
    description: text('description'),
    dateAdded: timestamp('date_added').defaultNow().notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, {onDelete: 'cascade'}),
  },
  (table) => [
    index('links_user_id_idx').on(table.userId),
    index('links_date_added_idx').on(table.dateAdded),
  ],
);

export const rssFeeds = pgTable(
  'rss_feeds',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, {onDelete: 'cascade'}),
    title: varchar('title', {length: 500}).notNull(),
    feedUrl: text('feed_url').notNull(),
    siteUrl: text('site_url'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('rss_feeds_user_id_idx').on(table.userId),
    index('rss_feeds_feed_url_idx').on(table.feedUrl),
  ],
);

export const rssFeedItems = pgTable(
  'rss_feed_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    feedId: uuid('feed_id')
      .notNull()
      .references(() => rssFeeds.id, {onDelete: 'cascade'}),
    guid: text('guid').notNull(),
    title: varchar('title', {length: 500}).notNull(),
    link: text('link').notNull(),
    summary: text('summary'),
    content: text('content'),
    imageUrl: text('image_url'),
    pubDate: timestamp('pub_date'),
    read: boolean('read').default(false).notNull(),
    clicked: boolean('clicked').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('rss_feed_items_feed_id_idx').on(table.feedId),
    index('rss_feed_items_pub_date_idx').on(table.pubDate),
    index('rss_feed_items_feed_guid_idx').on(table.feedId, table.guid),
  ],
);

export const rssFeedImportHistory = pgTable(
  'rss_feed_import_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    feedId: uuid('feed_id')
      .notNull()
      .references(() => rssFeeds.id, {onDelete: 'cascade'}),
    importDate: timestamp('import_date').defaultNow().notNull(),
    itemCount: integer('item_count').notNull(),
    status: varchar('status', {length: 50}).notNull(),
    errorMessage: text('error_message'),
  },
  (table) => [
    index('rss_feed_import_history_feed_id_idx').on(table.feedId),
    index('rss_feed_import_history_import_date_idx').on(table.importDate),
  ],
);

export const stats = pgTable(
  'stats',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    type: varchar('type', {length: 100}).notNull(),
    statTime: timestamp('stat_time').defaultNow().notNull(),
    data: jsonb('data').notNull(),
  },
  (table) => [
    index('stats_type_idx').on(table.type),
    index('stats_type_time_idx').on(table.type, table.statTime),
  ],
);

export const emailItems = pgTable(
  'email_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, {onDelete: 'cascade'}),
    emailMessageId: text('email_message_id').notNull(),
    emailFrom: varchar('email_from', {length: 255}).notNull(),
    link: text('link').notNull(),
    title: varchar('title', {length: 500}),
    description: text('description'),
    read: boolean('read').default(false).notNull(),
    clicked: boolean('clicked').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('email_items_user_id_idx').on(table.userId),
    index('email_items_created_at_idx').on(table.createdAt),
    uniqueIndex('email_items_user_message_link_idx').on(table.userId, table.emailMessageId, table.link),
  ],
);

export const usersRelations = relations(users, ({many}) => ({
  links: many(links),
  rssFeeds: many(rssFeeds),
  emailItems: many(emailItems),
}));

export const linksRelations = relations(links, ({one}) => ({
  user: one(users, {
    fields: [links.userId],
    references: [users.id],
  }),
}));

export const rssFeedsRelations = relations(rssFeeds, ({one, many}) => ({
  user: one(users, {
    fields: [rssFeeds.userId],
    references: [users.id],
  }),
  items: many(rssFeedItems),
  importHistory: many(rssFeedImportHistory),
}));

export const rssFeedItemsRelations = relations(rssFeedItems, ({one}) => ({
  feed: one(rssFeeds, {
    fields: [rssFeedItems.feedId],
    references: [rssFeeds.id],
  }),
}));

export const rssFeedImportHistoryRelations = relations(rssFeedImportHistory, ({one}) => ({
  feed: one(rssFeeds, {
    fields: [rssFeedImportHistory.feedId],
    references: [rssFeeds.id],
  }),
}));

export const emailItemsRelations = relations(emailItems, ({one}) => ({
  user: one(users, {
    fields: [emailItems.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Link = typeof links.$inferSelect;
export type NewLink = typeof links.$inferInsert;
export type RssFeed = typeof rssFeeds.$inferSelect;
export type NewRssFeed = typeof rssFeeds.$inferInsert;
export type RssFeedItem = typeof rssFeedItems.$inferSelect;
export type NewRssFeedItem = typeof rssFeedItems.$inferInsert;
export type RssFeedImportHistory = typeof rssFeedImportHistory.$inferSelect;
export type NewRssFeedImportHistory = typeof rssFeedImportHistory.$inferInsert;
export type Stats = typeof stats.$inferSelect;
export type NewStats = typeof stats.$inferInsert;
export type EmailItem = typeof emailItems.$inferSelect;
export type NewEmailItem = typeof emailItems.$inferInsert;
