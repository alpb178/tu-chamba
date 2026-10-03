import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({ description: 'Token del enlace de verificación' })
  @IsString()
  @IsNotEmpty()
  token: string;
}
