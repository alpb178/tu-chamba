import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';
import { BULK_MAX_ITEMS } from './bulk-create-ads.dto';

export class BulkDeleteAdsDto {
  @ApiProperty({ type: [String], description: 'Ids de los anuncios a borrar' })
  @IsArray()
  @ArrayNotEmpty({ message: 'No hay anuncios seleccionados' })
  @ArrayMaxSize(BULK_MAX_ITEMS, {
    message: `Máximo ${BULK_MAX_ITEMS} anuncios por borrado`,
  })
  @IsUUID('all', { each: true })
  ids: string[];
}
