import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

// Admin creation from the panel: email, password and, optionally, the
// username (used to sign in; if missing it is taken from the email).
export class CreateAdminDto {
  @ApiProperty({ example: 'nuevo-admin@tuchamba.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'soporte' })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'El usuario no puede estar vacío' })
  name?: string;

  @ApiProperty({ example: 'Password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;
}
