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
import { Categoria, Departamento, TipoJornada } from '@prisma/client';

// Duraciones de publicación permitidas (en días). 3 es el valor por defecto.
export const DURACIONES_DIAS = [3, 7, 15, 30];

export class CreateAnuncioDto {
  @ApiProperty({ example: 'Se busca vendedor con experiencia en atención al cliente.' })
  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @ApiPropertyOptional({ example: 'Experiencia mínima de 1 año. Disponibilidad inmediata.' })
  @IsOptional()
  @IsString()
  requisitos?: string;

  @ApiProperty({ example: 'Santa Cruz de la Sierra, zona norte' })
  @IsString()
  @IsNotEmpty({ message: 'La ubicación es obligatoria' })
  ubicacion: string;

  @ApiProperty({ enum: Departamento, example: Departamento.SANTA_CRUZ })
  @IsEnum(Departamento, { message: 'Selecciona un departamento válido' })
  departamento: Departamento;

  @ApiProperty({ enum: Categoria, example: Categoria.VENTAS })
  @IsEnum(Categoria, { message: 'Selecciona una categoría válida' })
  categoria: Categoria;

  // Coordenadas del pin elegido en el mapa (opcionales).
  @ApiPropertyOptional({ example: -17.7833 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitud?: number;

  @ApiPropertyOptional({ example: -63.1821 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitud?: number;

  @ApiPropertyOptional({ example: 'Lun-Vie 8:00 a 16:00' })
  @IsOptional()
  @IsString()
  horario?: string;

  @ApiProperty({ example: 2500, description: 'Salario en Bs' })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  salario: number;

  @ApiProperty({ example: '71111111' })
  @IsString()
  @IsNotEmpty()
  telefono: string;

  @ApiProperty({ enum: TipoJornada, example: TipoJornada.TIEMPO_COMPLETO })
  @IsEnum(TipoJornada)
  tipoJornada: TipoJornada;

  @ApiPropertyOptional({
    description: 'Días de publicación (por defecto 3)',
    enum: DURACIONES_DIAS,
    default: 3,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn(DURACIONES_DIAS, { message: 'duracionDias debe ser 3, 7, 15 o 30' })
  duracionDias?: number;
}
