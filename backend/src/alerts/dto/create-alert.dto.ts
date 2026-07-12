import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { Category, Department } from '@prisma/client';

// Una alerta sin departamento ni categoría equivale a "todas las ofertas".
export class CreateAlertDto {
  @ApiPropertyOptional({ enum: Department, description: 'null = cualquier departamento' })
  @IsOptional()
  @IsEnum(Department)
  department?: Department;

  @ApiPropertyOptional({ enum: Category, description: 'null = cualquier categoría' })
  @IsOptional()
  @IsEnum(Category)
  category?: Category;
}
