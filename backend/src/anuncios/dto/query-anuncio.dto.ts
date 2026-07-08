import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Categoria, Departamento, TipoJornada } from '@prisma/client';

// Los filtros de lista aceptan selección múltiple como cadenas separadas por
// coma (p. ej. "VENTAS,GASTRONOMIA"). El servicio valida contra los enums.
export class QueryAnuncioDto {
  @ApiPropertyOptional({ description: 'TipoJornada(s) separadas por coma' })
  @IsOptional()
  @IsString()
  tipoJornada?: string;

  @ApiPropertyOptional({ description: 'Departamento(s) separados por coma' })
  @IsOptional()
  @IsString()
  departamento?: string;

  @ApiPropertyOptional({ description: 'Categoría(s) separadas por coma' })
  @IsOptional()
  @IsString()
  categoria?: string;

  @ApiPropertyOptional({ description: 'Salario mínimo (Bs)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salarioMin?: number;

  @ApiPropertyOptional({ description: 'Salario máximo (Bs)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salarioMax?: number;

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

// Enums válidos para filtrar (se ignoran valores desconocidos en la query).
export const JORNADAS = Object.values(TipoJornada);
export const DEPARTAMENTOS = Object.values(Departamento);
export const CATEGORIAS = Object.values(Categoria);
