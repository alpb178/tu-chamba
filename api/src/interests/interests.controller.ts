import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InterestsService } from './interests.service';
import { CreateInterestDto } from './dto/create-interest.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@ApiTags('interests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('interests')
export class InterestsController {
  constructor(private interests: InterestsService) {}

  // Records interest in an ad: when opening the detail (silent) or on contact
  // (contact=true, notifies the owner the first time).
  @Post()
  register(@Body() dto: CreateInterestDto, @CurrentUser() user: AuthUser) {
    return this.interests.register(dto.adId, user, dto.contact ?? false);
  }

  // Ads the user has shown interest in.
  @Get('mine')
  findMine(@CurrentUser() user: AuthUser) {
    return this.interests.findMine(user.id);
  }

  // Have I already shown interest in this ad? (to render the state in the detail)
  @Get('status/:adId')
  status(@Param('adId') adId: string, @CurrentUser() user: AuthUser) {
    return this.interests.status(adId, user.id);
  }

  // Remove an ad from my interest list.
  @Delete(':adId')
  remove(@Param('adId') adId: string, @CurrentUser() user: AuthUser) {
    return this.interests.remove(adId, user.id);
  }
}
