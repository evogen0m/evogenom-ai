import { Module } from '@nestjs/common';
import { OpenAiProvider } from './openai';

@Module({
  providers: [OpenAiProvider],
  exports: [OpenAiProvider],
})
export class OpenAIModule {}
