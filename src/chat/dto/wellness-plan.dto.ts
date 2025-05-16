import { ApiProperty } from '@nestjs/swagger';

export class WellnessPlanResponse {
  @ApiProperty({
    type: String,
    nullable: true,
    description:
      'The wellness plan content in Markdown format, or null if not available.',
  })
  wellnessPlan: string | null;
}
