import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';
import { Role } from '@prisma/client';
import { RegisterRole } from './register.dto';

export class GoogleAuthDto {
  @ApiProperty({ description: 'ID token emitido por Google Identity Services' })
  @IsString()
  @IsNotEmpty()
  idToken: string;

  // Solo se exige al crear una cuenta nueva (la API responde needsProfile
  // cuando el correo de Google aún no existe en la plataforma).
  @ApiPropertyOptional({ enum: RegisterRole })
  @IsOptional()
  @IsEnum(RegisterRole, { message: 'role debe ser TRABAJADOR o EMPLEADOR' })
  role?: Role;

  @ApiPropertyOptional({ description: 'Obligatorio si role es EMPLEADOR' })
  @ValidateIf(
    (o) => o.role === RegisterRole.EMPLEADOR || (o.telefono ?? '') !== '',
  )
  @IsString()
  @IsNotEmpty({ message: 'El teléfono es obligatorio para empleadores' })
  telefono?: string;
}
