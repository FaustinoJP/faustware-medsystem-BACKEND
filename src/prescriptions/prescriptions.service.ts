import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
        medicationId: dto.medicationId,
        dosage: dto.dosage,
        frequency: dto.frequency,
        duration: dto.duration,
        route: dto.route,
        instructions: dto.instructions,
      },
      include: {
        medication: true,
        prescription: true,
      },
    });

    await this.auditService.log({
      userId,
      module: 'prescriptions',
      action: 'add_item',
      entityName: 'PrescriptionItem',
      entityId: item.id,
      newValues: item,
    });

    return this.prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: this.includeConfig(),
    });
  }

  async removeItem(
    appointmentId: string,
    prescriptionId: string,
    itemId: string,
    userId: string,
  ) {
    const encounter = await this.prisma.encounter.findUnique({ where: { appointmentId } });
    if (!encounter) {
      throw new NotFoundException('Atendimento clínico não encontrado para esta consulta');
    }

    if (encounter.status === EncounterStatus.CLOSED) {
      throw new BadRequestException('Não é possível alterar prescrição em atendimento fechado');
    }

    const item = await this.prisma.prescriptionItem.findUnique({
      where: { id: itemId },
      include: { prescription: true },
    });

    if (!item || item.prescriptionId !== prescriptionId || item.prescription.encounterId !== encounter.id) {
      throw new NotFoundException('Item da prescrição não encontrado');
    }

    await this.prisma.prescriptionItem.delete({ where: { id: itemId } });

    await this.auditService.log({
      userId,
      module: 'prescriptions',
      action: 'remove_item',
      entityName: 'PrescriptionItem',
      entityId: item.id,
      oldValues: item,
    });

    return this.prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: this.includeConfig(),
    });
  }

  private includeConfig() {
    return {
      patient: true,
      doctor: true,
      encounter: true,
      items: {
        include: {
          medication: true,
        },
      },
    };
  }
}
