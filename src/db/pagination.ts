import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { PgSelect } from 'drizzle-orm/pg-core';

export class PagedQuery {
  @ApiProperty({ required: false, default: 0, type: Number })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(0)
  page?: number = 0;

  @ApiProperty({ required: false, default: 10, type: Number })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  pageSize?: number = 10;
}

export function withPagination<T extends PgSelect>(
  qb: T,
  page: number = 0,
  pageSize: number = 10,
) {
  return qb.limit(pageSize).offset(page * pageSize);
}

export abstract class PagedResult<T> {
  abstract items: T[];
  @ApiProperty()
  total: number;
  @ApiProperty()
  page: number;
  @ApiProperty()
  pageSize: number;
}
