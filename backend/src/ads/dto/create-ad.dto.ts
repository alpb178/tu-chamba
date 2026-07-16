import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Category, Department, JobType } from '@prisma/client';

// Duraciones de publicación permitidas (en días). 3 es el valor por defecto.
export const DURATION_DAYS = [3, 7, 15, 30];

export class CreateAdDto {
  @ApiProperty({ example: 'Se busca vendedor con experiencia en atención al cliente.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ example: 'Experiencia mínima de 1 año. Disponibilidad inmediata.' })
  @IsOptional()
  @IsString()
  requirements?: string;

  // Opcional a nivel de API: la importación por CSV y el formulario del admin
  // solo exigen descripción y teléfono. El sitio web la exige en su formulario.
  @ApiPropertyOptional({ example: 'Santa Cruz de la Sierra, zona norte' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ enum: Department, example: Department.SANTA_CRUZ })
  @IsEnum(Department, { message: 'Selecciona un departamento válido' })
  department: Department;

  @ApiProperty({ enum: Category, example: Category.VENTAS })
  @IsEnum(Category, { message: 'Selecciona una categoría válida' })
  category: Category;

  // Coordenadas del pin elegido en el mapa (opcionales).
  @ApiPropertyOptional({ example: -17.7833 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ example: -63.1821 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ example: 'Lun-Vie 8:00 a 16:00' })
  @IsOptional()
  @IsString()
  schedule?: string;

  // Opcional: sin salario el anuncio se muestra como "a convenir".
  @ApiPropertyOptional({ example: 2500, description: 'Salario en Bs' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  salary?: number;

  @ApiProperty({ example: '71111111' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ enum: JobType, example: JobType.TIEMPO_COMPLETO })
  @IsEnum(JobType)
  jobType: JobType;

  @ApiPropertyOptional({
    description: 'Días de publicación (por defecto 3)',
    enum: DURATION_DAYS,
    default: 3,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn(DURATION_DAYS, { message: 'durationDays debe ser 3, 7, 15 o 30' })
  durationDays?: number;
}
