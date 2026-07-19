import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

// Borrado por lotes desde el panel: ids de los registros seleccionados.
export class BulkIdsDto {
  @ApiProperty({ type: [String], description: 'Ids de los registros a borrar' })
  @IsArray()
  @ArrayNotEmpty({ message: 'No hay registros seleccionados' })
  @ArrayMaxSize(500, { message: 'Máximo 500 registros por borrado' })
  @IsUUID('all', { each: true })
  ids: string[];
}
