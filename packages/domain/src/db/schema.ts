import {pgTable, text, timestamp, uuid, varchar, index} from 'drizzle-orm/pg-core';
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

export const usersRelations = relations(users, ({many}) => ({
  links: many(links),
}));

export const linksRelations = relations(links, ({one}) => ({
  user: one(users, {
    fields: [links.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Link = typeof links.$inferSelect;
export type NewLink = typeof links.$inferInsert;
