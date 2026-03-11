import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EncounterStatus, LabOrderStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { AddLabOrderItemDto } from './dto/add-lab-order-item.dto';
import { CreateLabOrderDto } from './dto/create-lab-order.dto';
import { CreateLabResultDto } from './dto/create-lab-result.dto';

@Injectable()
export class LabOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(appointmentId: string, dto: CreateLabOrderDto, userId: string) {
    const encounter = await this.prisma.encounter.findUnique({ where: { appointmentId } });

    if (!encounter) {
      throw new NotFoundException('Atendimento clínico não encontrado para esta consulta');
    }

    if (encounter.status === EncounterStatus.CLOSED) {
      throw new BadRequestException('Não é possível criar pedido de exame em atendimento fechado');
    }
     const labOrder = await this.prisma.labOrder.create({
      data: {
        patientId: encounter.patientId,
        encounterId: encounter.id,
        requestedById: userId,
        notes: dto.notes,
      },
      include: this.includeConfig(),
    });

    await this.auditService.log({
      userId,
      module: 'lab_orders',
      action: 'create',
      entityName: 'LabOrder',
      entityId: labOrder.id,
      newValues: labOrder,
    });

    return labOrder;
  }

 async findAllByAppointment(appointmentId: string) {
    const encounter = await this.prisma.encounter.findUnique({ where: { appointmentId } });

    if (!encounter) {
      throw new NotFoundException('Atendimento clínico não encontrado para esta consulta');
    }

    return this.prisma.labOrder.findMany({
      where: { encounterId: encounter.id },
      include: this.includeConfig(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async addItem(appointmentId: string, labOrderId: string, dto: AddLabOrderItemDto, userId: string) {
    const encounter = await this.prisma.encounter.findUnique({ where: { appointmentId } });
    if (!encounter) {
      throw new NotFoundException('Atendimento clínico não encontrado para esta consulta');
    }

    if (encounter.status === EncounterStatus.CLOSED) {
      throw new BadRequestException('Não é possível alterar pedido de exame em atendimento fechado');
    }


     const labOrder = await this.prisma.labOrder.findUnique({ where: { id: labOrderId } });
    if (!labOrder || labOrder.encounterId !== encounter.id) {
      throw new NotFoundException('Pedido de exame não encontrado');
    }

    const labTestType = await this.prisma.labTestType.findUnique({
      where: { id: dto.labTestTypeId },
    });
    if (!labTestType) {
      throw new NotFoundException('Tipo de exame não encontrado');
    }

    const item = await this.prisma.labOrderItem.create({
      data: {
        labOrderId,
        labTestTypeId: dto.labTestTypeId,
      },
      include: {
        labTestType: true,
        labOrder: true,
      },
    });

       await this.auditService.log({
      userId,
      module: 'lab_orders',
      action: 'add_item',
      entityName: 'LabOrderItem',
      entityId: item.id,
      newValues: item,
    });

    return this.prisma.labOrder.findUnique({
      where: { id: labOrderId },
      include: this.includeConfig(),
    });
  }

  async updateStatus(
    appointmentId: string,
    labOrderId: string,
    status: LabOrderStatus,
    userId: string,
  ) {
    const encounter = await this.prisma.encounter.findUnique({ where: { appointmentId } });
    if (!encounter) {
      throw new NotFoundException('Atendimento clínico não encontrado para esta consulta');
    }

    const labOrder = await this.prisma.labOrder.findUnique({ where: { id: labOrderId } });
    if (!labOrder || labOrder.encounterId !== encounter.id) {
      throw new NotFoundException('Pedido de exame não encontrado');
    }

      const updated = await this.prisma.$transaction(async (tx) => {
      const order = await tx.labOrder.update({
        where: { id: labOrderId },
        data: { status },
      });

      await tx.labOrderItem.updateMany({
        where: { labOrderId },
        data: { status },
      });

      return order;
    });

    await this.auditService.log({
      userId,
      module: 'lab_orders',
      action: 'status_update',
      entityName: 'LabOrder',
      entityId: updated.id,
      newValues: updated,
    });

    return this.prisma.labOrder.findUnique({
      where: { id: labOrderId },
      include: this.includeConfig(),
    });
  }

    async createOrUpdateResult(
    appointmentId: string,
    labOrderId: string,
    itemId: string,
    dto: CreateLabResultDto,
    userId: string,
  ) {
    const encounter = await this.prisma.encounter.findUnique({ where: { appointmentId } });
    if (!encounter) {
      throw new NotFoundException('Atendimento clínico não encontrado para esta consulta');
    }

    const item = await this.prisma.labOrderItem.findUnique({
      where: { id: itemId },
      include: { labOrder: true, result: true },
    });

    if (!item || item.labOrderId !== labOrderId || item.labOrder.encounterId !== encounter.id) {
      throw new NotFoundException('Item do exame não encontrado');
    }


         const result = item.result
      ? await this.prisma.labResult.update({
          where: { labOrderItemId: itemId },
          data: {
            resultText: dto.resultText,
            resultFileUrl: dto.resultFileUrl,
            validatedById: userId,
            validatedAt: new Date(),
          },
        })
      : await this.prisma.labResult.create({
          data: {
            labOrderItemId: itemId,
            resultText: dto.resultText,
            resultFileUrl: dto.resultFileUrl,
            validatedById: userId,
            validatedAt: new Date(),
          },
        });

    await this.prisma.labOrderItem.update({
      where: { id: itemId },
      data: { status: LabOrderStatus.COMPLETED },
    });

    const remainingPending = await this.prisma.labOrderItem.count({
      where: {
        labOrderId,
        status: { not: LabOrderStatus.COMPLETED },
      },
    });

        await this.prisma.labOrder.update({
      where: { id: labOrderId },
      data: {
        status: remainingPending === 0 ? LabOrderStatus.COMPLETED : LabOrderStatus.IN_PROGRESS,
      },
    });

    await this.auditService.log({
      userId,
      module: 'lab_orders',
      action: item.result ? 'update_result' : 'create_result',
      entityName: 'LabResult',
      entityId: result.id,
      newValues: result,
    });

    return this.prisma.labOrder.findUnique({
      where: { id: labOrderId },
      include: this.includeConfig(),
    });
  }

    private includeConfig() {
    return {
      patient: true,
      encounter: true,
      requestedBy: true,
      items: {
        include: {
          labTestType: true,
          result: true,
        },
      },
    };
  }
}



    
