import { Transactional, TransactionHost } from '@nestjs-cls/transactional';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { and, desc, eq } from 'drizzle-orm';
import {
  ChatCompletionAssistantMessageParam,
  ChatCompletionMessageParam,
  ChatCompletionUserMessageParam,
} from 'openai/resources/chat';
import { AppConfigType } from 'src/config';
import { chatMessages, chats, users } from 'src/db';
import { DbTransactionAdapter } from 'src/db/drizzle.provider';
import { OpenAiProvider } from 'src/openai/openai';
import {
  ChatEventResponse,
  ChatMessageResponse,
  ChatRequest,
} from '../dto/chat';
@Injectable()
export class ChatService {
  constructor(
    private readonly openai: OpenAiProvider,
    private readonly txHost: TransactionHost<DbTransactionAdapter>,
    private readonly configService: ConfigService<AppConfigType>,
  ) {}

  logger = new Logger(ChatService.name);

  async *createChatStream(
    request: ChatRequest,
    userId: string,
  ): AsyncGenerator<ChatEventResponse> {
    const client = this.openai.getOpenAiClient();

    this.logger.log(`Streaming chat for user ${userId}`);
    await this.ensureUserExists(userId);
    const chat = await this.getOrCreateChat(userId);

    // Save the user's message to the database
    const userMessageId = randomUUID();
    await this.txHost.tx.insert(chatMessages).values({
      id: userMessageId,
      content: request.content,
      role: 'user',
      userId,
      chatId: chat.id,
    });

    this.logger.debug(
      `Saved user message ${userMessageId} for chat ${chat.id}`,
    );

    const chatCompletion = await client.chat.completions.create({
      model: this.configService.getOrThrow('AZURE_OPENAI_MODEL'),
      messages: [
        ...(await this.getChatHistory(userId, chat.id)),
        { role: 'user', content: request.content },
      ],
      stream: true,
    });

    const buffer: string[] = [];

    const messageId = randomUUID();

    for await (const chunk of chatCompletion) {
      const data = chunk.choices.at(0)?.delta.content;
      if (!data) {
        continue;
      }

      buffer.push(data);
      yield {
        id: messageId,
        chunk: data,
        event: 'chunk',
      };
    }

    const completedMessage = buffer.join('');

    const message = await this.txHost.tx
      .insert(chatMessages)
      .values({
        id: messageId,
        content: completedMessage,
        role: 'assistant',
        userId,
        chatId: chat.id,
      })
      .returning()
      .then(([message]) => message);

    yield {
      id: message.id,
      content: completedMessage,
      role: 'assistant',
      event: 'message',
      createdAt: message.createdAt,
    };

    this.logger.log(`Chat stream completed for user ${userId}`);
  }

  @Transactional()
  async getOrCreateChat(userId: string) {
    const tx = this.txHost.tx;

    const chat = await tx.query.chats.findFirst({
      where: eq(chats.userId, userId),
    });

    if (!chat) {
      return await tx
        .insert(chats)
        .values({
          id: randomUUID(),
          userId,
        })
        .returning()
        .then(([chat]) => chat);
    }

    return chat;
  }

  @Transactional()
  async getMessages(userId: string): Promise<ChatMessageResponse[]> {
    const tx = this.txHost.tx;

    const messages = await tx.query.chatMessages.findMany({
      where: eq(chatMessages.userId, userId),
      orderBy: [desc(chatMessages.createdAt)],
    });

    return messages.map((message) => ChatMessageResponse.fromDb(message));
  }

  @Transactional()
  async ensureUserExists(userId: string) {
    const tx = this.txHost.tx;
    const user = await tx.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      await tx.insert(users).values({ id: userId }).returning();
    }
  }

  @Transactional()
  private async getChatHistory(
    userId: string,
    chatId: string,
  ): Promise<ChatCompletionMessageParam[]> {
    const tx = this.txHost.tx;
    const messages = await tx.query.chatMessages.findMany({
      where: and(
        eq(chatMessages.userId, userId),
        eq(chatMessages.chatId, chatId),
      ),
      orderBy: [desc(chatMessages.createdAt)],
    });

    return messages.map((message) => {
      switch (message.role) {
        case 'user':
          return {
            role: 'user',
            content: message.content,
          } as ChatCompletionUserMessageParam;
        case 'assistant':
          return {
            role: 'assistant',
            content: message.content,
          } as ChatCompletionAssistantMessageParam;
        default:
          throw new Error(`Unknown message role: ${message.role}`);
      }
    });
  }
}
