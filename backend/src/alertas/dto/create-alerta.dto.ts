import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { Categoria, Departamento } from '@prisma/client';

// Una alerta sin departamento ni categoría equivale a "todas las ofertas".
export class CreateAlertaDto {
  @ApiPropertyOptional({ enum: Departamento, description: 'null = cualquier departamento' })
  @IsOptional()
  @IsEnum(Departamento)
  departamento?: Departamento;

  @ApiPropertyOptional({ enum: Categoria, description: 'null = cualquier categoría' })
  @IsOptional()
  @IsEnum(Categoria)
  categoria?: Categoria;
}
