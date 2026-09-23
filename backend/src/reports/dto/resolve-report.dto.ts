import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ReportStatus } from '@prisma/client';

// Status change from the panel: resolve, dismiss or reopen (PENDIENTE).
export class ResolveReportDto {
  @ApiProperty({ enum: ReportStatus })
  @IsEnum(ReportStatus, {
    message: 'status debe ser PENDIENTE, ATENDIDO o DESCARTADO',
  })
  status: ReportStatus;
}
