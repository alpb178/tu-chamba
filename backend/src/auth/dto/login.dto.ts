import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, ValidateIf } from 'class-validator';

// Debe venir identifier o email (al menos uno). identifier acepta el
// nombre de usuario o el correo (lo usa el panel admin); email queda por
// compatibilidad con la web y la app móvil, que envían solo el correo.
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
