import { ApiProperty } from '@nestjs/swagger';
import { PgSelect } from 'drizzle-orm/pg-core';

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
