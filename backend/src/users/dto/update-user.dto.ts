import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';

// Edición de un usuario desde el panel de administración (datos de la cuenta
// y, para cuentas locales, la contraseña).
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

  // String vacío = quitar el teléfono.
  @ApiPropertyOptional({ example: '70000000' })
  @ValidateIf((o) => o.phone != null)
  @IsString()
  phone?: string;

  // Nueva contraseña (solo cuentas locales; las de Google se rechazan en el
  // servicio). Mínimo 6 caracteres, igual que el registro.
  @ApiPropertyOptional({ example: 'nuevaClave123' })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password?: string;
}
