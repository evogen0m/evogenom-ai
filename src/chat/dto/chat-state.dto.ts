import { ApiProperty } from '@nestjs/swagger';
import { ChatState } from '../enum/chat-state.enum';

export class ChatStateResponse {
  @ApiProperty({ enum: ChatState, enumName: 'ChatState' })
  state: ChatState;
}
