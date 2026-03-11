import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AddInvoiceItemDto } from './dto/add-invoice-item.dto';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { RegisterPaymentDto } from './dto/register-payment.dto';
import { BillingService } from './billing.service';

@ApiTags('Billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('appointments/:appointmentId/billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('invoice')
  createInvoice(
    @Param('appointmentId') appointmentId: string,
    @Body() dto: CreateInvoiceDto,
    @CurrentUser() user: any,
  ) {
    return this.billingService.createInvoiceForAppointment(appointmentId, dto, user.sub);
  }

  @Get('invoice')
  getInvoice(@Param('appointmentId') appointmentId: string) {
    return this.billingService.getInvoiceByAppointment(appointmentId);
  }

  @Post('invoice/items')
  addInvoiceItem(
    @Param('appointmentId') appointmentId: string,
    @Body() dto: AddInvoiceItemDto,
    @CurrentUser() user: any,
  ) {
    return this.billingService.addInvoiceItemByAppointment(appointmentId, dto, user.sub);
  }

  @Post('payments')
  registerPayment(
    @Param('appointmentId') appointmentId: string,
    @Body() dto: RegisterPaymentDto,
    @CurrentUser() user: any,
  ) {
    return this.billingService.registerPaymentByAppointment(appointmentId, dto, user.sub);
  }

  @Patch('invoice/issue')
  issueInvoice(@Param('appointmentId') appointmentId: string, @CurrentUser() user: any) {
    return this.billingService.issueInvoiceByAppointment(appointmentId, user.sub);
  }
}
