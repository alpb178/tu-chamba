import { Global, Module } from '@nestjs/common';
import { TracesService } from './traces.service';

// Global: cualquier módulo puede registrar trazas sin importar este módulo
// (mismo criterio que PrismaModule).
@Global()
@Module({
  providers: [TracesService],
  exports: [TracesService],
})
export class TracesModule {}
