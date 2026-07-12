import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ReportReason } from '@prisma/client';

export class CreateReportDto {
  @ApiProperty({ description: 'ID del anuncio reportado' })
  @IsUUID()
  adId: string;

  @ApiProperty({ enum: ReportReason, example: ReportReason.SPAM })
  @IsEnum(ReportReason)
  reason: ReportReason;

  @ApiPropertyOptional({ example: 'El anuncio pide dinero por adelantado.' })
  @IsOptional()
  @IsString()
  comment?: string;
}
