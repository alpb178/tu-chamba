import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateVisitDto {
  @ApiProperty({ description: 'ID del anuncio visitado' })
  @IsUUID()
  adId: string;
}
