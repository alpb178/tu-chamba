import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

// Moderación: el admin corrige una reseña (calificación o comentario).
export class UpdateReviewDto {
  @ApiPropertyOptional({ example: 4, minimum: 1, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ example: 'Buen trato y pago puntual.' })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'El comentario no puede estar vacío' })
  comment?: string;
}
