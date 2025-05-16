import { Module } from '@nestjs/common';
import { ContentfulModule } from 'src/contentful/contentful.module';
import { EvogenomApiClientModule } from 'src/evogenom-api-client/evogenom-api-client.module';
import { OpenAIModule } from 'src/openai/openai.module';
import { AwsModule } from '../aws/aws.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat/chat.service';
import { PromptService } from './chat/prompt.service';
import { ResultService } from './chat/result.service';
import { CancelFollowupTool } from './tool/cancel-followup.tool';
import { EditWellnessPlanTool } from './tool/edit-wellness-plan.tool';
import { FollowupTool } from './tool/followup.tool';
import { MemoryTool } from './tool/memory-tool';
import { OnboardingTool } from './tool/onboarding.tool';
import { ProfileTool } from './tool/profile.tool';

@Module({
  controllers: [ChatController],
  providers: [
    ChatService,
    PromptService,
    ResultService,
    MemoryTool,
    FollowupTool,
    CancelFollowupTool,
    ProfileTool,
    OnboardingTool,
    EditWellnessPlanTool,
  ],
  imports: [OpenAIModule, EvogenomApiClientModule, ContentfulModule, AwsModule],
  exports: [ChatService],
})
export class ChatModule {}
