import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ReportStatus } from '@prisma/client';

// Cambio de estado desde el panel: atender, descartar o reabrir (PENDIENTE).
export class ResolveReportDto {
  @ApiProperty({ enum: ReportStatus })
  @IsEnum(ReportStatus, {
    message: 'status debe ser PENDIENTE, ATENDIDO o DESCARTADO',
  })
  status: ReportStatus;
}
