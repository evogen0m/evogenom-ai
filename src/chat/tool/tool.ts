import { ChatCompletionTool } from 'openai/resources/chat';

export interface ToolCall {
  name: string;
  arguments: string;
}

export interface Tool {
  execute: (userId: string, input: ToolCall) => Promise<string>;
  toolDefinition: ChatCompletionTool;
  canExecute: (toolCall: ToolCall) => boolean;
}
