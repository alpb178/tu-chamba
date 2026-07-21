import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

// Una visita es a un anuncio (adId), al sitio en general (path) o un clic en
// una tarjeta de "Sitios de interés" (company). Debe venir exactamente uno.
export class CreateVisitDto {
  @ApiPropertyOptional({ description: 'ID del anuncio visitado' })
  @ValidateIf((o: CreateVisitDto) => o.path === undefined && o.company === undefined)
  @IsUUID()
  adId?: string;

  @ApiPropertyOptional({
    description: 'Ruta de la página vista en el portal (ej. /listings)',
  })
  @ValidateIf((o: CreateVisitDto) => o.adId === undefined && o.company === undefined)
  @IsString()
  @Matches(/^\//, { message: 'path debe empezar con /' })
  @MaxLength(200)
  path?: string;

  @ApiPropertyOptional({
    description: 'Slug de la empresa cuya tarjeta de "Sitios de interés" se abrió',
  })
  @ValidateIf((o: CreateVisitDto) => o.adId === undefined && o.path === undefined)
  @IsString()
  @MaxLength(64)
  company?: string;

  @ApiPropertyOptional({
    description: 'Nombre visible de la empresa (para el panel)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  label?: string;
}
