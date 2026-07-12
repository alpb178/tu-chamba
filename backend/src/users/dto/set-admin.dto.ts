import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

// Conceder o revocar acceso al panel de administración.
export class SetAdminDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isAdmin: boolean;
}
