import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBooleanString,
  IsIn,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Category, Department, JobType } from '@prisma/client';

// Effective statuses filterable in the panel (VENCIDO is derived from expiresAt).
export const EFFECTIVE_STATUSES = ['ACTIVO', 'VENCIDO', 'DADO_DE_BAJA'] as const;
export type EffectiveStatus = (typeof EFFECTIVE_STATUSES)[number];

// List filters accept multiple selection as comma-separated strings
// (e.g. "VENTAS,GASTRONOMIA"). The service validates against the enums.
export class QueryAdDto {
  @ApiPropertyOptional({ description: 'JobType(s) separados por coma' })
  @IsOptional()
  @IsString()
  jobType?: string;

  @ApiPropertyOptional({ description: 'Department(s) separados por coma' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ description: 'Category(s) separadas por coma' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Salario mínimo (Bs)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salaryMin?: number;

  @ApiPropertyOptional({ description: 'Salario máximo (Bs)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salaryMax?: number;

  @ApiPropertyOptional({ description: 'Texto a buscar en la descripción' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Texto a buscar en la ubicación (ciudad o zona)',
  })
  @IsOptional()
  @IsString()
  location?: string;

  // ——— Admin report filters (only apply on /listings/all) ———

  @ApiPropertyOptional({ description: 'Solo anuncios de clientes (no admins)' })
  @IsOptional()
  @IsBooleanString()
  clientsOnly?: string;

  @ApiPropertyOptional({ description: 'Publicados desde (YYYY-MM-DD)' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ description: 'Publicados hasta (YYYY-MM-DD)' })
  @IsOptional()
  @IsISO8601()
  to?: string;

  @ApiPropertyOptional({ description: 'Email o nombre del publicante (parcial)' })
  @IsOptional()
  @IsString()
  owner?: string;

  @ApiPropertyOptional({ enum: EFFECTIVE_STATUSES })
  @IsOptional()
  @IsIn(EFFECTIVE_STATUSES)
  status?: EffectiveStatus;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  // Pages of 10 meant for web and mobile; cap for admin/SEO views.
  @ApiPropertyOptional({ default: 10, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

// Valid enums for filtering (unknown values in the query are ignored).
export const JOB_TYPES = Object.values(JobType);
export const DEPARTMENTS = Object.values(Department);
export const CATEGORIES = Object.values(Category);
