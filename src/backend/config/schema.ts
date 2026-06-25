// src/backend/config/schema.ts
import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const clients = sqliteTable('clients', {
  id:         text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  firstName:  text('first_name').notNull(),
  lastName:   text('last_name').notNull(),
  phone:      text('phone'),
  email:      text('email'),
  archived:   integer('archived', { mode: 'boolean' }).notNull().default(false),
  createdAt:  integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt:  integer('updated_at', { mode: 'timestamp' }).notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
}, (t) => ({
  lastNameIdx: index('idx_clients_last_name').on(t.lastName),
  createdAtIdx: index('idx_clients_created_at').on(t.createdAt),
  /** UNIQUE constraint prevents the race condition where two concurrent
   *  creates both pass the `existsByEmail` check and insert duplicate emails. */
  emailUniqIdx: uniqueIndex('idx_clients_email_unique').on(t.email),
}));

/** Used by version-guard — tracks which schema version this DB was last opened with */
export const schemaMeta = sqliteTable('schema_meta', {
  key:   text('key').primaryKey(),
  value: text('value').notNull(),
});
