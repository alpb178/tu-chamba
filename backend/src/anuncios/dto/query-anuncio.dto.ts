import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Categoria, Departamento, TipoJornada } from '@prisma/client';

export class QueryAnuncioDto {
  @ApiPropertyOptional({ enum: TipoJornada })
  @IsOptional()
  @IsEnum(TipoJornada)
  tipoJornada?: TipoJornada;

  @ApiPropertyOptional({ enum: Departamento })
  @IsOptional()
  @IsEnum(Departamento)
  departamento?: Departamento;

  @ApiPropertyOptional({ enum: Categoria })
  @IsOptional()
  @IsEnum(Categoria)
  categoria?: Categoria;

  @ApiPropertyOptional({ description: 'Texto a buscar en la descripción' })
  @IsOptional()
  @IsString()
  search?: string;

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
