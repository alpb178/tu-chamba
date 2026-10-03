import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, ValidateIf } from 'class-validator';

// Either identifier or email must be present (at least one). identifier
// accepts the username or the email (used by the admin panel); email is kept
// for compatibility with the web and the mobile app, which send only the email.
export class LoginDto {
  @ApiPropertyOptional({
    example: 'admin',
    description: 'Nombre de usuario o correo',
  })
  @ValidateIf((o: LoginDto) => o.email === undefined)
  @IsString()
  @IsNotEmpty({ message: 'Se requiere el usuario o correo' })
  identifier?: string;

  @ApiPropertyOptional({ example: 'admin@tuchamba.com' })
  @ValidateIf((o: LoginDto) => o.identifier === undefined)
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'Password123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
