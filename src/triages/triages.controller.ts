import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AppointmentStatus } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateTriageDto } from './dto/create-triage.dto';
import { UpdateTriageDto } from './dto/update-triage.dto';
import { TriagesService } from './triages.service';

@ApiTags('Triages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('appointments/:appointmentId/triage')
export class TriagesController {
  constructor(private readonly triagesService: TriagesService) {}

  @Post()
  create(
    @Param('appointmentId') appointmentId: string,
    @Body() dto: CreateTriageDto,
    @CurrentUser() user: any,
  ) {
    return this.triagesService.create(appointmentId, dto, user.sub);
  }

  @Get()
  findOne(@Param('appointmentId') appointmentId: string) {
    return this.triagesService.findByAppointment(appointmentId);
  }

  @Patch()
  update(
    @Param('appointmentId') appointmentId: string,
    @Body() dto: UpdateTriageDto,
    @CurrentUser() user: any,
  ) {
    return this.triagesService.update(appointmentId, dto, user.sub);
  }
}
