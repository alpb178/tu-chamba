import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

// Una visita es a un anuncio (adId) o al sitio en general (path).
// Debe venir al menos uno de los dos campos.
export class CreateVisitDto {
  @ApiPropertyOptional({ description: 'ID del anuncio visitado' })
  @ValidateIf((o: CreateVisitDto) => o.path === undefined)
  @IsUUID()
  adId?: string;

  @ApiPropertyOptional({
    description: 'Ruta de la página vista en el portal (ej. /anuncios)',
  })
  @ValidateIf((o: CreateVisitDto) => o.adId === undefined)
  @IsString()
  @Matches(/^\//, { message: 'path debe empezar con /' })
  @MaxLength(200)
  path?: string;
}
