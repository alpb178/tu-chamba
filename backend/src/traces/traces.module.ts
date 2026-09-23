import { Global, Module } from '@nestjs/common';
import { TracesService } from './traces.service';

// Global: any module can record traces without importing this module
// (same approach as PrismaModule).
@Global()
@Module({
  providers: [TracesService],
  exports: [TracesService],
})
export class TracesModule {}
