import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
  registerDecorator,
  ValidationArguments,
} from 'class-validator';
import { Category, Department, JobType } from '@prisma/client';

// Allowed listing durations (in days). 3 is the default.
export const DURATION_DAYS = [3, 7, 15, 30];

// Cap on extra phone numbers: listings publish two or three.
export const MAX_EXTRA_PHONES = 4;

// Cap on the panel's manual priority. Two digits are more than enough to
// order featured listings among themselves and keep the column readable.
export const MAX_PRIORITY = 99;

// A salary range needs its lower bound and can't be reversed
// ("Bs 4.500 a 3.500"). Only applies when salaryMax is present.
function IsSalaryRange() {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'isSalaryRange',
      target: object.constructor,
      propertyName,
      validator: {
        validate(max: unknown, args: ValidationArguments) {
          const { salary } = args.object as { salary?: number };
          if (typeof max !== 'number') return true; // validated by @IsNumber
          return typeof salary === 'number' && max >= salary;
        },
        defaultMessage() {
          return 'El salario máximo requiere un salario mínimo y debe ser mayor o igual a este';
        },
      },
    });
}

export class CreateAdDto {
  @ApiProperty({ example: 'Vendedor de tienda' })
  @IsString()
  @IsNotEmpty({ message: 'El título es obligatorio' })
  @MaxLength(120, { message: 'El título no puede superar los 120 caracteres' })
  title: string;

  @ApiProperty({ example: 'Se busca vendedor con experiencia en atención al cliente.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ example: 'Experiencia mínima de 1 año. Disponibilidad inmediata.' })
  @IsOptional()
  @IsString()
  requirements?: string;

  // Optional at the API level: the CSV import and the admin form only require
  // description and phone. The website requires it in its form.
  @ApiPropertyOptional({ example: 'Santa Cruz de la Sierra, zona norte' })
  @IsOptional()
  @IsString()
  location?: string;

  // Free-text reference: guides the applicant but isn't filtered on.
  @ApiPropertyOptional({ example: 'Frente al mercado Los Pozos, piso 2' })
  @IsOptional()
  @IsString()
  @MaxLength(200, {
    message: 'La referencia no puede superar los 200 caracteres',
  })
  locationReference?: string;

  @ApiProperty({ enum: Department, example: Department.SANTA_CRUZ })
  @IsEnum(Department, { message: 'Selecciona un departamento válido' })
  department: Department;

  @ApiProperty({ enum: Category, example: Category.VENTAS })
  @IsEnum(Category, { message: 'Selecciona una categoría válida' })
  category: Category;

  // Coordinates of the pin chosen on the map (optional).
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

  // Optional: without a salary the listing shows as "a convenir". With
  // salaryMax the pair shows as a range and salary is the lower bound.
  @ApiPropertyOptional({ example: 2500, description: 'Salario en Bs' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  salary?: number;

  @ApiPropertyOptional({
    example: 3500,
    description: 'Techo del rango salarial en Bs (requiere salary)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @IsSalaryRange()
  salaryMax?: number;

  @ApiProperty({ example: '71111111' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  // Extra contact numbers (newspaper listings publish two or three).
  @ApiPropertyOptional({ type: [String], example: ['71111111', '3467010'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_EXTRA_PHONES, {
    message: `Como máximo ${MAX_EXTRA_PHONES} teléfonos adicionales`,
  })
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  extraPhones?: string[];

  @ApiProperty({ enum: JobType, example: JobType.TIEMPO_COMPLETO })
  @IsEnum(JobType)
  jobType: JobType;

  // Only an admin can set it: the service ignores it if whoever publishes or
  // edits has no panel access.
  @ApiPropertyOptional({
    description: 'Prioridad manual: el mayor va primero (0 = normal, solo admin)',
    default: 0,
    maximum: MAX_PRIORITY,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_PRIORITY, { message: `La prioridad no puede superar ${MAX_PRIORITY}` })
  priority?: number;

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
