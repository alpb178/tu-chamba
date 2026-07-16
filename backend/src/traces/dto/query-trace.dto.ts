import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { TraceResult, TraceType } from '@prisma/client';

export class QueryTraceDto {
  @ApiPropertyOptional({ enum: TraceType })
  @IsOptional()
  @IsEnum(TraceType)
  type?: TraceType;

  @ApiPropertyOptional({ enum: TraceResult })
  @IsOptional()
  @IsEnum(TraceResult)
  result?: TraceResult;

  // Email del actor (búsqueda parcial, sin distinguir mayúsculas).
  @ApiPropertyOptional({ example: 'ana@' })
  @IsOptional()
  @IsString()
  actor?: string;

  @ApiPropertyOptional({ example: '2026-07-01', description: 'Desde (YYYY-MM-DD)' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ example: '2026-07-31', description: 'Hasta (YYYY-MM-DD)' })
  @IsOptional()
  @IsISO8601()
  to?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
