import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';

// Global so AuthModule (and future modules) can inject it without re-importing.
@Global()
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
