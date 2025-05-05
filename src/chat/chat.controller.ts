import {
  Controller,
  Get,
  Logger,
  MessageEvent,
  Query,
  Sse,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiProperty,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import * as rxjs from 'rxjs';
import { Observable } from 'rxjs';
import { AuthGuard } from 'src/auth/auth/auth.guard';
import { User } from 'src/auth/decorators';
import { UserPrincipal } from 'src/auth/UserPrincipal';
import { PagedResult } from 'src/db';
import { ChatService } from './chat/chat.service';
import {
  ChatChunkEventResponse,
  ChatMessageEventResponse,
  ChatMessageResponse,
  ChatRequest,
} from './dto/chat';

class ChatMessagesResponse extends PagedResult<ChatMessageResponse> {
  @ApiProperty({ type: [ChatMessageResponse] })
  items: ChatMessageResponse[];
}

@ApiBearerAuth()
@ApiTags('Chat')
@ApiExtraModels(ChatChunkEventResponse, ChatMessageEventResponse)
@Controller('/api/chat')
@UseGuards(AuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  logger = new Logger(ChatController.name);
  @Sse('/sse')
  @ApiResponse({
    status: 200,
    description: `
    Stream of SSE events

    The stream is a sequence of events, each containing a single message or chunk of a message.

    The event type is determined by the discriminator property in the payload.

    sse event type will be always 'message' or 'error', payload is JSON encoded, sse data is described by the openapi schema
    
    
    `,
    content: {
      'text/event-stream': {
        schema: {
          oneOf: [
            { $ref: getSchemaPath(ChatChunkEventResponse) },
            { $ref: getSchemaPath(ChatMessageEventResponse) },
          ],
          discriminator: {
            propertyName: 'event',
            mapping: {
              chunk: getSchemaPath(ChatChunkEventResponse),
              message: getSchemaPath(ChatMessageEventResponse),
            },
          },
        },
      },
    },
  })
  streamChat(
    @Query() query: ChatRequest,
    @User() user: UserPrincipal,
  ): Observable<MessageEvent> {
    let eventId = 0;
    this.logger.debug(`Creating chat stream for user ${user.id}`);
    return rxjs
      .from(
        this.chatService.createChatStream(
          query,
          user.id,
          user.evogenomApiToken,
        ),
      )
      .pipe(
        rxjs.map((event) => {
          eventId++;
          return {
            event: 'message',
            data: event,
            id: eventId.toString(),
          };
        }),
        rxjs.catchError((error) => {
          this.logger.error('Error in chat stream', error);
          return rxjs.of({
            event: 'error',
            data: {
              message:
                error.message || 'An error occurred during chat processing',
            },
            id: (++eventId).toString(),
          });
        }),
      );
  }

  @Get('/messages')
  @ApiResponse({
    status: 200,
    type: ChatMessagesResponse,
    isArray: true,
    description: 'Get all messages for the current user',
  })
  async getMessages(
    @User() user: UserPrincipal,
  ): Promise<ChatMessagesResponse> {
    const messages = await this.chatService.getMessagesForUi(user.id);
    return {
      items: messages,
      total: messages.length,
      page: 0,
      pageSize: messages.length,
    };
  }
}
