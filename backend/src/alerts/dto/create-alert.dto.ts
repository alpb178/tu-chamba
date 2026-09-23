import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { Category, Department } from '@prisma/client';

// An alert with no department and no category means "all listings".
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
