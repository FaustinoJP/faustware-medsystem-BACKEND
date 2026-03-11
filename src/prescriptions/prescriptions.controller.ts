import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AddPrescriptionItemDto } from './dto/add-prescription-item.dto';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { PrescriptionsService } from './prescriptions.service';

@ApiTags('Prescriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('appointments/:appointmentId/prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Post()
  create(
    @Param('appointmentId') appointmentId: string,
    @Body() dto: CreatePrescriptionDto,
    @CurrentUser() user: any,
  ) {
    return this.prescriptionsService.create(appointmentId, dto, user.sub);
  }

  @Get()
  findAll(@Param('appointmentId') appointmentId: string) {
    return this.prescriptionsService.findAllByAppointment(appointmentId);
  }

  @Post(':prescriptionId/items')
  addItem(
    @Param('appointmentId') appointmentId: string,
    @Param('prescriptionId') prescriptionId: string,
    @Body() dto: AddPrescriptionItemDto,
    @CurrentUser() user: any,
  ) {
    return this.prescriptionsService.addItem(appointmentId, prescriptionId, dto, user.sub);
  }

  @Delete(':prescriptionId/items/:itemId')
  removeItem(
    @Param('appointmentId') appointmentId: string,
    @Param('prescriptionId') prescriptionId: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user: any,
  ) {
    return this.prescriptionsService.removeItem(appointmentId, prescriptionId, itemId, user.sub);
  }
}
