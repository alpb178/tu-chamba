import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { ReportStatus } from '@prisma/client';

export class ResolveReportDto {
  @ApiProperty({ enum: [ReportStatus.ATENDIDO, ReportStatus.DESCARTADO] })
  @IsIn([ReportStatus.ATENDIDO, ReportStatus.DESCARTADO], {
    message: 'status debe ser ATENDIDO o DESCARTADO',
  })
  status: ReportStatus;
}
