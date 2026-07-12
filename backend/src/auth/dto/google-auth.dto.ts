import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleAuthDto {
  @ApiProperty({ description: 'ID token emitido por Google Identity Services' })
  @IsString()
  @IsNotEmpty()
  idToken: string;
}
