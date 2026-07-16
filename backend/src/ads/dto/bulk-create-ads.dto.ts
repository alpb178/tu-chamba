import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { CreateAdDto } from './create-ad.dto';

// Límite defensivo para la importación por CSV del panel admin.
export const BULK_MAX_ITEMS = 500;

export class BulkCreateAdsDto {
  @ApiProperty({ type: [CreateAdDto] })
  @IsArray()
  @ArrayNotEmpty({ message: 'El archivo no contiene ofertas para importar' })
  @ArrayMaxSize(BULK_MAX_ITEMS, {
    message: `Máximo ${BULK_MAX_ITEMS} ofertas por importación`,
  })
  @ValidateNested({ each: true })
  @Type(() => CreateAdDto)
  items: CreateAdDto[];
}
