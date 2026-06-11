import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  // GET /api/health — público. Devuelve 200 si el servicio (y la DB) responden.
  // Lo usa el health check de Render.
  @Get()
  async check() {
    let database = 'ok';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      database = 'down';
    }
    return {
      status: 'ok',
      database,
      uptime: process.uptime(),
    };
  }
}
