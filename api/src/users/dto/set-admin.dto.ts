import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

// Grant or revoke access to the admin panel.
export class SetAdminDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isAdmin: boolean;
}
