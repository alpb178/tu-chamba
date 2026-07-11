import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateInterestDto {
  @ApiProperty({ description: 'ID del anuncio que interesa' })
  @IsUUID()
  adId: string;
}
