import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { AppointmentsService } from './appointments.service';

@ApiTags('Appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  create(@Body() dto: CreateAppointmentDto, @CurrentUser() user: any) {
    return this.appointmentsService.create(dto, user.sub);
  }

  @Get()
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'doctorId', required: false })
  @ApiQuery({ name: 'date', required: false, description: 'YYYY-MM-DD' })
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('doctorId') doctorId?: string,
    @Query('date') date?: string,
  ) {
    return this.appointmentsService.findAll({ search, status, doctorId, date });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAppointmentDto, @CurrentUser() user: any) {
    return this.appointmentsService.update(id, dto, user.sub);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.appointmentsService.updateStatus(id, dto.status, user.sub);
  }
}
