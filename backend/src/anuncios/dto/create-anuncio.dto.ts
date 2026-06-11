import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';
import { TipoJornada } from '@prisma/client';

export class CreateAnuncioDto {
  @ApiProperty({ example: 'Se busca vendedor con experiencia en atención al cliente.' })
  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @ApiProperty({ example: 2500, description: 'Salario en Bs' })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  salario: number;

  @ApiProperty({ example: '71111111' })
  @IsString()
  @IsNotEmpty()
  telefono: string;

  @ApiProperty({ enum: TipoJornada, example: TipoJornada.TIEMPO_COMPLETO })
  @IsEnum(TipoJornada)
  tipoJornada: TipoJornada;
}
