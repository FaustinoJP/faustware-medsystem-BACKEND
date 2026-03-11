
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InvoiceStatus, PaymentStatus, Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { AddInvoiceItemDto } from './dto/add-invoice-item.dto';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { RegisterPaymentDto } from './dto/register-payment.dto';

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async createInvoiceForAppointment(appointmentId: string, dto: CreateInvoiceDto, userId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { invoice: true, patient: true },
    });

    if (!appointment) {
      throw new NotFoundException('Consulta não encontrada');
    }

    if (appointment.invoice) {
      throw new BadRequestException('Esta consulta já possui factura');
    }

  const invoiceNumber = await this.generateInvoiceNumber();
    const discountAmount = dto.discountAmount ?? 0;

    const invoice = await this.prisma.invoice.create({
      data: {
        patientId: appointment.patientId,
        appointmentId,
        invoiceNumber,
        totalAmount: new Prisma.Decimal(0),
        discountAmount: new Prisma.Decimal(discountAmount),
        paidAmount: new Prisma.Decimal(0),
        balance: new Prisma.Decimal(0),
        status: InvoiceStatus.DRAFT,
      },
      include: this.includeConfig(),
    });

    await this.auditService.log({
      userId,
      module: 'billing',
      action: 'create_invoice',
      entityName: 'Invoice',
      entityId: invoice.id,
      newValues: invoice,
    });

   return invoice;
  }

  async getInvoiceByAppointment(appointmentId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { appointmentId },
      include: this.includeConfig(),
    });

    if (!invoice) {
      throw new NotFoundException('Factura não encontrada para esta consulta');
    }

    return invoice;
  }

  async addInvoiceItemByAppointment(appointmentId: string, dto: AddInvoiceItemDto, userId: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { appointmentId } });
    if (!invoice) {
      throw new NotFoundException('Factura não encontrada para esta consulta');
    }

    if (invoice.status === InvoiceStatus.PAID || invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException('Não é possível alterar esta factura');
    }

    if (dto.serviceId) {
      const service = await this.prisma.service.findUnique({ where: { id: dto.serviceId } });
      if (!service || !service.isActive) {
        throw new NotFoundException('Serviço não encontrado ou inativo');
      }
    }

    const totalPrice = dto.quantity * dto.unitPrice;

    const item = await this.prisma.invoiceItem.create({
      data: {
        invoiceId: invoice.id,
        serviceId: dto.serviceId,
        serviceType: dto.serviceType,
        referenceId: dto.referenceId,
        description: dto.description,
        quantity: dto.quantity,
        unitPrice: new Prisma.Decimal(dto.unitPrice),
        totalPrice: new Prisma.Decimal(totalPrice),
      },
    });


   await this.recalculateInvoiceTotals(invoice.id);

    await this.auditService.log({
      userId,
      module: 'billing',
      action: 'add_invoice_item',
      entityName: 'InvoiceItem',
      entityId: item.id,
      newValues: item,
    });

    return this.prisma.invoice.findUnique({
      where: { id: invoice.id },
      include: this.includeConfig(),
    });
  }

  async issueInvoiceByAppointment(appointmentId: string, userId: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { appointmentId } });
    if (!invoice) {
      throw new NotFoundException('Factura não encontrada para esta consulta');
    }

    const itemsCount = await this.prisma.invoiceItem.count({ where: { invoiceId: invoice.id } });
    if (itemsCount === 0) {
      throw new BadRequestException('Não é possível emitir uma factura sem itens');
    }

  const updated = await this.prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: invoice.paidAmount.greaterThanOrEqualTo(invoice.balance) && !invoice.balance.greaterThan(0)
          ? InvoiceStatus.PAID
          : invoice.paidAmount.greaterThan(0)
            ? InvoiceStatus.PARTIALLY_PAID
            : InvoiceStatus.ISSUED,
        issuedById: userId,
        issuedAt: new Date(),
      },
      include: this.includeConfig(),
    });

    await this.auditService.log({
      userId,
      module: 'billing',
      action: 'issue_invoice',
      entityName: 'Invoice',
      entityId: updated.id,
      newValues: updated,
    });

    return updated;
  }

 async registerPaymentByAppointment(appointmentId: string, dto: RegisterPaymentDto, userId: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { appointmentId } });
    if (!invoice) {
      throw new NotFoundException('Factura não encontrada para esta consulta');
    }

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException('Não é possível pagar uma factura cancelada');
    }

    if (Number(invoice.balance) <= 0) {
      throw new BadRequestException('Esta factura já está liquidada');
    }

    if (dto.amount > Number(invoice.balance)) {
      throw new BadRequestException('O valor do pagamento excede o saldo em aberto');
    }

    const paymentMethod = await this.prisma.paymentMethod.findUnique({
      where: { id: dto.paymentMethodId },
    });


     if (!paymentMethod || !paymentMethod.isActive) {
      throw new NotFoundException('Método de pagamento não encontrado ou inativo');
    }

    const payment = await this.prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        paymentMethodId: dto.paymentMethodId,
        amount: new Prisma.Decimal(dto.amount),
        transactionReference: dto.transactionReference,
        receivedById: userId,
        status: PaymentStatus.SUCCESS,
      },
    });

    await this.recalculateInvoiceTotals(invoice.id);

    await this.auditService.log({
      userId,
      module: 'billing',
      action: 'register_payment',
      entityName: 'Payment',
      entityId: payment.id,
      newValues: payment,
    });


   return this.prisma.invoice.findUnique({
      where: { id: invoice.id },
      include: this.includeConfig(),
    });
  }

  private async recalculateInvoiceTotals(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: true,
        payments: {
          where: { status: PaymentStatus.SUCCESS },
        },
      },
    });

      if (!invoice) {
      throw new NotFoundException('Factura não encontrada');
    }

    const grossTotal = invoice.items.reduce((sum, item) => sum + Number(item.totalPrice), 0);
    const paidTotal = invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const discount = Number(invoice.discountAmount);
    const netTotal = Math.max(grossTotal - discount, 0);
    const balance = Math.max(netTotal - paidTotal, 0);

    let status: InvoiceStatus = invoice.status;
    if (invoice.status !== InvoiceStatus.CANCELLED) {
      if (balance === 0 && netTotal > 0) {
        status = InvoiceStatus.PAID;
      } else if (paidTotal > 0) {
        status = InvoiceStatus.PARTIALLY_PAID;
      } else if (invoice.issuedAt) {
        status = InvoiceStatus.ISSUED;
      } else {
        status = InvoiceStatus.DRAFT;
      }
    }


   await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        totalAmount: new Prisma.Decimal(netTotal),
        paidAmount: new Prisma.Decimal(paidTotal),
        balance: new Prisma.Decimal(balance),
        status,
      },
    });
  }

  private async generateInvoiceNumber() {
    const year = new Date().getFullYear();
    const count = await this.prisma.invoice.count();
    const next = String(count + 1).padStart(6, '0');
    return `INV-${year}-${next}`;
  }


 private includeConfig() {
    return {
      patient: true,
      appointment: true,
      issuedBy: true,
      items: {
        include: {
          service: true,
        },
      },
      payments: {
        include: {
          paymentMethod: true,
          receivedBy: true,
        },
      },
    };
  }
}

// ============================================================
// PATCH EM src/app.module.ts
// ============================================================
// Adicionar imports:
// import { PrescriptionsModule } from './prescriptions/prescriptions.module';
// import { LabOrdersModule } from './lab-orders/lab-orders.module';
// import { BillingModule } from './billing/billing.module';
//
// E nos imports do módulo:
// PrescriptionsModule,
// LabOrdersModule,
// BillingModule,

// ============================================================
// SUGESTÃO DE SEED COMPLEMENTAR
// ============================================================
// Criar no prisma/seed.ts também:
// - PaymentMethod: Cash, Card, Transferência, Seguro
// - alguns Medication
// - alguns LabTestType
// - alguns Service

// ============================================================
// EXEMPLOS DE ROTAS
// ============================================================
// POST   /api/v1/appointments/:appointmentId/prescriptions
// GET    /api/v1/appointments/:appointmentId/prescriptions
// POST   /api/v1/appointments/:appointmentId/prescriptions/:prescriptionId/items
// DELETE /api/v1/appointments/:appointmentId/prescriptions/:prescriptionId/items/:itemId
//
// POST   /api/v1/appointments/:appointmentId/lab-orders
// GET    /api/v1/appointments/:appointmentId/lab-orders
// POST   /api/v1/appointments/:appointmentId/lab-orders/:labOrderId/items
// PATCH  /api/v1/appointments/:appointmentId/lab-orders/:labOrderId/status/:status
// POST   /api/v1/appointments/:appointmentId/lab-orders/:labOrderId/items/:itemId/result
//
// POST   /api/v1/appointments/:appointmentId/billing/invoice
// GET    /api/v1/appointments/:appointmentId/billing/invoice
// POST   /api/v1/appointments/:appointmentId/billing/invoice/items
// PATCH  /api/v1/appointments/:appointmentId/billing/invoice/issue
// POST   /api/v1/appointments/:appointmentId/billing/payments
