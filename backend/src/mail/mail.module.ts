import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';

// Global para que AuthModule (y futuros) lo inyecten sin re-importar.
@Global()
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
