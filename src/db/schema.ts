import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  vector,
} from 'drizzle-orm/pg-core';

// Base tables with common fields
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Chat models
export const chats = pgTable(
  'chat',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [index('chat_user_id_index').on(t.userId)],
);

export const chatMessages = pgTable(
  'chat_message',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    chatId: uuid('chat_id')
      .notNull()
      .references(() => chats.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    // Stores tool call requests (as array) for assistant messages
    // or the tool call ID for tool result messages.
    toolData: jsonb('tool_data'), // Nullable jsonb column
    // Embeddings are not indexed since pgvector does not support multiple columns in the same index
    // It's better to use userId index for filtering
    embedding: vector('embedding', {
      dimensions: 1536,
    }),
  },
  (t) => [
    index('chat_message_chat_id_index').on(t.chatId),
    index('chat_message_user_id_index').on(t.userId),
    index('chat_message_user_id_created_at_index').on(t.userId, t.createdAt),
  ],
);
