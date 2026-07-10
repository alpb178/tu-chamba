import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Role } from '@prisma/client';

// Solo se permite registro público como TRABAJADOR o EMPLEADOR.
export enum RegisterRole {
  TRABAJADOR = 'TRABAJADOR',
  EMPLEADOR = 'EMPLEADOR',
}

export class RegisterDto {
  @ApiProperty({ example: 'usuario@correo.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  @IsNotEmpty()
  name: string;

  // Obligatorio para EMPLEADOR (es el contacto de sus anuncios);
  // opcional para TRABAJADOR. Si viene, debe ser un string no vacío.
  @ApiPropertyOptional({ example: '70000000', description: 'Obligatorio para EMPLEADOR' })
  @ValidateIf(
    (o) => o.role === RegisterRole.EMPLEADOR || (o.phone ?? '') !== '',
  )
  @IsString()
  @IsNotEmpty({ message: 'El teléfono es obligatorio para empleadores' })
  phone?: string;

  @ApiProperty({ enum: RegisterRole, example: RegisterRole.EMPLEADOR })
  @IsEnum(RegisterRole, {
    message: 'role debe ser TRABAJADOR o EMPLEADOR',
  })
  role: Role;
}
