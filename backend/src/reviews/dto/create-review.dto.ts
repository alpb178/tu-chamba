import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ description: 'ID del empleador a reseñar' })
  @IsUUID()
  employerId: string;

  @ApiProperty({ example: 4, minimum: 1, maximum: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ example: 'Buen trato y pago puntual.' })
  @IsString()
  @IsNotEmpty({ message: 'El comentario es obligatorio' })
  comment: string;
}
