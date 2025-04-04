import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsNotEmpty, IsString } from 'class-validator';
import { chatMessages } from 'src/db';

export class ChatMessageResponse {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Message ID',
  })
  id: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Message role',
    enum: ['user', 'assistant'],
  })
  role: 'user' | 'assistant';

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Message content',
  })
  content: string;

  @IsDate()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Message creation date',
  })
  createdAt: Date;

  static fromDb(
    message: typeof chatMessages.$inferSelect,
  ): ChatMessageResponse {
    return {
      id: message.id,
      role: message.role as 'user' | 'assistant',
      content: message.content,
      createdAt: message.createdAt,
    };
  }
}

export class ChatChunkResponse {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Message ID',
  })
  id: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Chunk content',
  })
  chunk: string;
}

export class ChatChunkEventResponse extends ChatChunkResponse {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Event type',
    enum: ['chunk'],
  })
  event: 'chunk';
}

export class ChatMessageEventResponse extends ChatMessageResponse {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Event type',
    enum: ['message'],
  })
  event: 'message';
}

export class ChatRequest {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Message content',
  })
  content: string;
}

export class ChatEventErrorResponse {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Event type',
    enum: ['error'],
  })
  event: 'error';

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Error message',
  })
  message: string;
}

export type ChatEventResponse =
  | ChatChunkEventResponse
  | ChatMessageEventResponse
  | ChatEventErrorResponse;
