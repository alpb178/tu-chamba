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

// Duraciones de publicación permitidas (en días). 3 es el valor por defecto.
export const DURATION_DAYS = [3, 7, 15, 30];

// Tope de números adicionales: los avisos publican dos o tres.
export const MAX_EXTRA_PHONES = 4;

// Tope de la prioridad manual del panel. Dos dígitos alcanzan de sobra para
// ordenar los destacados entre sí y mantienen legible la columna.
export const MAX_PRIORITY = 99;

// Un rango salarial necesita su extremo inferior y no puede ir al revés
// ("Bs 4.500 a 3.500"). Solo aplica cuando llega salaryMax.
function IsSalaryRange() {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'isSalaryRange',
      target: object.constructor,
      propertyName,
      validator: {
        validate(max: unknown, args: ValidationArguments) {
          const { salary } = args.object as { salary?: number };
          if (typeof max !== 'number') return true; // lo valida @IsNumber
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

  // Opcional a nivel de API: la importación por CSV y el formulario del admin
  // solo exigen descripción y teléfono. El sitio web la exige en su formulario.
  @ApiPropertyOptional({ example: 'Santa Cruz de la Sierra, zona norte' })
  @IsOptional()
  @IsString()
  location?: string;

  // Referencia en texto libre: orienta al postulante pero no se filtra.
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

  // Opcional: sin salario el anuncio se muestra como "a convenir". Con
  // salaryMax el par se muestra como rango y salary es el extremo inferior.
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

  // Números adicionales de contacto (los avisos de prensa publican dos o tres).
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

  // Solo el admin puede fijarla: el servicio la ignora si quien publica o
  // edita no tiene acceso al panel.
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
