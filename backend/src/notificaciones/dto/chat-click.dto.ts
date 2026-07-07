import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ChatClickDto {
  @ApiProperty({ description: 'ID del anuncio cuyo botón Chatear se pulsó' })
  @IsUUID()
  anuncioId: string;
}
