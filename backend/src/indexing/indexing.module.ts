import { Global, Module } from '@nestjs/common';
import { GoogleIndexingService } from './google-indexing.service';

// Global: los anuncios se crean/eliminan desde varios módulos (ads, cron).
@Global()
@Module({
  providers: [GoogleIndexingService],
  exports: [GoogleIndexingService],
})
export class IndexingModule {}
