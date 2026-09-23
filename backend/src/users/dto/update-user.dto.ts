import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';

// Editing a user from the admin panel (account details and, for local
// accounts, the password).
export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Juan Pérez' })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
  name?: string;

  @ApiPropertyOptional({ example: 'juan@example.com' })
  @IsOptional()
  @IsEmail({}, { message: 'El correo no es válido' })
  email?: string;

  // Empty string = remove the phone number.
  @ApiPropertyOptional({ example: '70000000' })
  @ValidateIf((o) => o.phone != null)
  @IsString()
  phone?: string;

  // New password (local accounts only; Google accounts are rejected in the
  // service). Minimum 6 characters, same as sign-up.
  @ApiPropertyOptional({ example: 'nuevaClave123' })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password?: string;
}
