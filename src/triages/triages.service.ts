import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTriageDto } from './dto/create-triage.dto';
import { UpdateTriageDto } from './dto/update-triage.dto';

@Injectable()
export class TriagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(appointmentId: string, dto: CreateTriageDto, userId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { triage: true },
    });

    if (!appointment) {
      throw new NotFoundException('Consulta não encontrada');
    }

    if (appointment.triage) {
      throw new BadRequestException('Esta consulta já possui triagem registada');
    }


        const triage = await this.prisma.$transaction(async (tx) => {
      const created = await tx.triage.create({
        data: {
          appointmentId,
          weight: dto.weight,
          height: dto.height,
          temperature: dto.temperature,
          bloodPressure: dto.bloodPressure,
          heartRate: dto.heartRate,
          respiratoryRate: dto.respiratoryRate,
          oxygenSaturation: dto.oxygenSaturation,
          notes: dto.notes,
          performedById: userId,
        },
      });

      await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          status: AppointmentStatus.IN_TRIAGE,
        },
      });

         return created;
    });

    await this.auditService.log({
      userId,
      module: 'triage',
      action: 'create',
      entityName: 'Triage',
      entityId: triage.id,
      newValues: triage,
    });

    return this.findByAppointment(appointmentId);
  }

  async findByAppointment(appointmentId: string) {
    const triage = await this.prisma.triage.findUnique({
      where: { appointmentId },
      include: {
        appointment: {
          include: {
            patient: true,
            doctor: true,
            department: true,
          },
        },
        performedBy: true,
      },
    });

        
    if (!triage) {
      throw new NotFoundException('Triagem não encontrada para esta consulta');
    }

    return triage;
  }

  async update(appointmentId: string, dto: UpdateTriageDto, userId: string) {
    const existing = await this.prisma.triage.findUnique({
      where: { appointmentId },
    });

    if (!existing) {
      throw new NotFoundException('Triagem não encontrada para esta consulta');
    }

         const updated = await this.prisma.triage.update({
      where: { appointmentId },
      data: {
        weight: dto.weight,
        height: dto.height,
        temperature: dto.temperature,
        bloodPressure: dto.bloodPressure,
        heartRate: dto.heartRate,
        respiratoryRate: dto.respiratoryRate,
        oxygenSaturation: dto.oxygenSaturation,
        notes: dto.notes,
      },
    });

    await this.auditService.log({
      userId,
      module: 'triage',
      action: 'update',
      entityName: 'Triage',
      entityId: updated.id,
      oldValues: existing,
      newValues: updated,
    });

    return this.findByAppointment(appointmentId);
  }
}
