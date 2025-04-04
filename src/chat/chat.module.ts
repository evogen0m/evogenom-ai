import { Module } from '@nestjs/common';
import { OpenAIModule } from 'src/openai/openai.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat/chat.service';
@Module({
  controllers: [ChatController],
  providers: [ChatService],
  imports: [OpenAIModule],
})
export class ChatModule {}
