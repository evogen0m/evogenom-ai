import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  vector,
} from 'drizzle-orm/pg-core';

// Enums
export const followUpStatusEnum = pgEnum('follow_up_status', [
  'pending',
  'sent',
  'failed',
  'cancelled',
]);

// New enum for message scope
export const messageScopeEnum = pgEnum('message_scope', [
  'ONBOARDING',
  'COACH',
]);

export type MessageScope = (typeof messageScopeEnum.enumValues)[number];
// Base tables with common fields
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  timeZone: text('time_zone').notNull().default('Europe/Helsinki'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  isOnboarded: boolean('is_onboarded').notNull().default(false),
  profile: jsonb('profile'),
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
    wellnessPlan: text('wellness_plan').notNull().default(''),
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
    messageScope: messageScopeEnum('message_scope').notNull(),
  },
  (t) => [
    index('chat_message_chat_id_index').on(t.chatId),
    index('chat_message_user_id_index').on(t.userId),
    index('chat_message_user_id_created_at_index').on(t.userId, t.createdAt),
  ],
);

// New table for caching quick responses
export const quickResponses = pgTable(
  'quick_response',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    chatId: uuid('chat_id')
      .notNull()
      .references(() => chats.id, { onDelete: 'cascade' }),
    // The assistant message for which these quick responses were generated
    assistantMessageId: uuid('assistant_message_id')
      .notNull()
      .references(() => chatMessages.id, { onDelete: 'cascade' }),
    // Array of quick response strings
    responses: jsonb('responses').$type<string[]>().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('quick_response_chat_id_assistant_message_id_index').on(
      t.chatId,
      t.assistantMessageId,
    ),
    index('quick_response_created_at_index').on(t.createdAt),
  ],
);

// Follow up models
export const followUps = pgTable(
  'follow_up',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    chatId: uuid('chat_id')
      .notNull()
      .references(() => chats.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
    status: followUpStatusEnum('status').notNull().default('pending'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('follow_up_user_id_index').on(t.userId),
    index('follow_up_chat_id_index').on(t.chatId),
    index('follow_up_due_date_index').on(t.dueDate),
    index('follow_up_status_index').on(t.status),
  ],
);
