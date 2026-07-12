import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';

// Perfil propio: solo datos personales (el correo no se cambia).
export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Juan Pérez' })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
  name?: string;

  // String vacío = quitar el teléfono.
  @ApiPropertyOptional({ example: '70000000' })
  @ValidateIf((o) => o.phone != null)
  @IsString()
  phone?: string;

  // Cambiar (o definir, en cuentas Google) la contraseña.
  @ApiPropertyOptional({ minLength: 6 })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password?: string;

  // Obligatoria para cambiarla cuando la cuenta ya tiene contraseña.
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currentPassword?: string;
}
