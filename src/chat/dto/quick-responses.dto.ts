import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class QuickResponse {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Quick response text',
    example: 'That sounds great!',
  })
  text: string;
}

export class QuickResponsesResponse {
  @IsArray()
  @ApiProperty({
    type: [QuickResponse],
    description: 'Array of quick response options',
  })
  quickResponses: QuickResponse[];
}
