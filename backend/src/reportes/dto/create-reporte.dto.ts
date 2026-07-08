import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { MotivoReporte } from '@prisma/client';

export class CreateReporteDto {
  @ApiProperty({ description: 'ID del anuncio reportado' })
  @IsUUID()
  anuncioId: string;

  @ApiProperty({ enum: MotivoReporte, example: MotivoReporte.SPAM })
  @IsEnum(MotivoReporte)
  motivo: MotivoReporte;

  @ApiPropertyOptional({ example: 'El anuncio pide dinero por adelantado.' })
  @IsOptional()
  @IsString()
  comentario?: string;
}
