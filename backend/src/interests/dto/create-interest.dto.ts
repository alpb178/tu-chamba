import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class CreateInterestDto {
  @ApiProperty({ description: 'ID del anuncio que interesa' })
  @IsUUID()
  adId: string;

  // true cuando el interés viene de contactar (Chatear/Llamar): la primera
  // vez avisa al dueño. Sin él, solo se registra el acceso al detalle.
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  contact?: boolean;
}
