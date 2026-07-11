import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

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
}
