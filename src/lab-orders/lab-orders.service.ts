import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

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
