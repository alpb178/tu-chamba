import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

// Edición de un usuario desde el panel de administración (datos de la
// cuenta; la contraseña solo la cambia el propio usuario desde su perfil).
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
}
