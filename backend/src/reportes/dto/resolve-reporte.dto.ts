import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { EstadoReporte } from '@prisma/client';

export class ResolveReporteDto {
  @ApiProperty({ enum: [EstadoReporte.ATENDIDO, EstadoReporte.DESCARTADO] })
  @IsIn([EstadoReporte.ATENDIDO, EstadoReporte.DESCARTADO], {
    message: 'estado debe ser ATENDIDO o DESCARTADO',
  })
  estado: EstadoReporte;
}
