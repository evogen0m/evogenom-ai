import { Module } from '@nestjs/common';
import { ContentfulModule } from 'src/contentful/contentful.module';
import { EvogenomApiClientModule } from 'src/evogenom-api-client/evogenom-api-client.module';
import { OpenAIModule } from 'src/openai/openai.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat/chat.service';
import { PromptService } from './chat/prompt.service';
@Module({
  controllers: [ChatController],
  providers: [ChatService, PromptService],
  imports: [OpenAIModule, EvogenomApiClientModule, ContentfulModule],
})
export class ChatModule {}
