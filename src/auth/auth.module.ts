import { Global, Module } from '@nestjs/common';
import { AuthGuard } from './auth/auth.guard';

@Global()
@Module({
  providers: [AuthGuard],
  exports: [AuthGuard],
})
export class AuthModule {}
