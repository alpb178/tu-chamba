import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
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
  nombre: string;

  @ApiProperty({ example: '70000000' })
  @IsString()
  @IsNotEmpty()
  telefono: string;

  @ApiProperty({ enum: RegisterRole, example: RegisterRole.EMPLEADOR })
  @IsEnum(RegisterRole, {
    message: 'role debe ser TRABAJADOR o EMPLEADOR',
  })
  role: Role;
}
