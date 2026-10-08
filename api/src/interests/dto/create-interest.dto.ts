import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class CreateInterestDto {
  @ApiProperty({ description: 'ID del anuncio que interesa' })
  @IsUUID()
  adId: string;

  // true when the interest comes from contacting (Chatear/Llamar): the first
  // time it notifies the owner. Without it, only the detail visit is recorded.
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  contact?: boolean;
}
