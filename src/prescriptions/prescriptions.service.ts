import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EncounterStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { AddPrescriptionItemDto } from './dto/add-prescription-item.dto';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';

@Injectable()
export class PrescriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(appointmentId: string, dto: CreatePrescriptionDto, userId: string) {
    const encounter = await this.prisma.encounter.findUnique({
      where: { appointmentId },
    });

    if (!encounter) {
      throw new NotFoundException('Atendimento clínico não encontrado para esta consulta');
    }

        if (encounter.status === EncounterStatus.CLOSED) {
      throw new BadRequestException('Não é possível criar prescrição em atendimento fechado');
    }

    const prescription = await this.prisma.prescription.create({
      data: {
        encounterId: encounter.id,
        patientId: encounter.patientId,
        doctorId: encounter.doctorId,
        notes: dto.notes,
      },
      include: this.includeConfig(),
    });

    await this.auditService.log({
      userId,
      module: 'prescriptions',
      action: 'create',
      entityName: 'Prescription',
      entityId: prescription.id,
      newValues: prescription,
    });

    return prescription;
  }

async findAllByAppointment(appointmentId: string) {
    const encounter = await this.prisma.encounter.findUnique({
      where: { appointmentId },
    });

    if (!encounter) {
      throw new NotFoundException('Atendimento clínico não encontrado para esta consulta');
    }

    return this.prisma.prescription.findMany({
      where: { encounterId: encounter.id },
      include: this.includeConfig(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async addItem(
    appointmentId: string,
    prescriptionId: string,
    dto: AddPrescriptionItemDto,
    userId: string,
  ) {
    const encounter = await this.prisma.encounter.findUnique({ where: { appointmentId } });
    if (!encounter) {
      throw new NotFoundException('Atendimento clínico não encontrado para esta consulta');
    }

    if (encounter.status === EncounterStatus.CLOSED) {
      throw new BadRequestException('Não é possível alterar prescrição em atendimento fechado');
    }

    const prescription = await this.prisma.prescription.findUnique({
      where: { id: prescriptionId },
    });

    if (!prescription || prescription.encounterId !== encounter.id) {
      throw new NotFoundException('Prescrição não encontrada');
    }

            const medication = await this.prisma.medication.findUnique({
      where: { id: dto.medicationId },
    });

    if (!medication || !medication.status) {
      throw new NotFoundException('Medicamento não encontrado ou inativo');
    }

    const item = await this.prisma.prescriptionItem.create({
      data: {
        prescriptionId,
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
