import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';

// Own profile: personal data only (the email cannot be changed).
export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Juan Pérez' })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
  name?: string;

  // Empty string = remove the phone.
  @ApiPropertyOptional({ example: '70000000' })
  @ValidateIf((o) => o.phone != null)
  @IsString()
  phone?: string;

  // Change (or set, for Google accounts) the password.
  @ApiPropertyOptional({ minLength: 6 })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password?: string;

  // Required to change it when the account already has a password.
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currentPassword?: string;
}
