import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
@UseGuards(JwtAuthGuard)
@Controller('appointments/:appointmentId/lab-orders')
export class LabOrdersController {
  constructor(private readonly labOrdersService: LabOrdersService) {}

  @Post()
  create(
    @Param('appointmentId') appointmentId: string,
    @Body() dto: CreateLabOrderDto,
    @CurrentUser() user: any,
  ) {
    return this.labOrdersService.create(appointmentId, dto, user.sub);
  }

  @Get()
  findAll(@Param('appointmentId') appointmentId: string) {
    return this.labOrdersService.findAllByAppointment(appointmentId);
  }

  @Post(':labOrderId/items')
  addItem(
    @Param('appointmentId') appointmentId: string,
    @Param('labOrderId') labOrderId: string,
    @Body() dto: AddLabOrderItemDto,
    @CurrentUser() user: any,
  ) {
    return this.labOrdersService.addItem(appointmentId, labOrderId, dto, user.sub);
  }

  @Patch(':labOrderId/status/:status')
  updateStatus(
    @Param('appointmentId') appointmentId: string,
    @Param('labOrderId') labOrderId: string,
    @Param('status') status: LabOrderStatus,
    @CurrentUser() user: any,
  ) {
    return this.labOrdersService.updateStatus(appointmentId, labOrderId, status, user.sub);
  }

  @Post(':labOrderId/items/:itemId/result')
  createOrUpdateResult(
    @Param('appointmentId') appointmentId: string,
    @Param('labOrderId') labOrderId: string,
    @Param('itemId') itemId: string,
    @Body() dto: CreateLabResultDto,
    @CurrentUser() user: any,
  ) {
    return this.labOrdersService.createOrUpdateResult(
      appointmentId,
      labOrderId,
      itemId,
      dto,
      user.sub,
    );
  }
}
