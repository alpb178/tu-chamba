import { Global, Module } from '@nestjs/common';
import { GoogleIndexingService } from './google-indexing.service';

// Global: listings are created/deleted from several modules (ads, cron).
@Global()
@Module({
  providers: [GoogleIndexingService],
  exports: [GoogleIndexingService],
})
export class IndexingModule {}
