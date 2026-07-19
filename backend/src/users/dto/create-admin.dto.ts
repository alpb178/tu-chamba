import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

// Alta de administradores desde el panel: correo, contraseña y, opcional,
// el nombre de usuario (sirve para iniciar sesión; si falta se toma del
// correo).
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
