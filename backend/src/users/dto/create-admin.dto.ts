import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

// Alta de administradores desde el panel: solo correo y contraseña.
export class CreateAdminDto {
  @ApiProperty({ example: 'nuevo-admin@tuchamba.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;
}
