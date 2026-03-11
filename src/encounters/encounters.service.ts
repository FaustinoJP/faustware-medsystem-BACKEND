import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AppointmentStatus, EncounterStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { AddClinicalNoteDto } from './dto/add-clinical-note.dto';
import { AddDiagnosisDto } from './dto/add-diagnosis.dto';
import { CreateEncounterDto } from './dto/create-encounter.dto';
import { UpdateEncounterDto } from './dto/update-encounter.dto';

@Injectable()
export class EncountersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(appointmentId: string, dto: CreateEncounterDto, userId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { encounter: true, triage: true },
    });

         if (!appointment) {
      throw new NotFoundException('Consulta não encontrada');
    }

    if (appointment.encounter) {
      throw new BadRequestException('Esta consulta já possui atendimento clínico');
    }

    const encounter = await this.prisma.$transaction(async (tx) => {
      const created = await tx.encounter.create({
        data: {
          appointmentId,
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          chiefComplaint: dto.chiefComplaint,
          historyOfPresentIllness: dto.historyOfPresentIllness,
          physicalExam: dto.physicalExam,
          assessment: dto.assessment,
          plan: dto.plan,
        },
      });

 await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          status: AppointmentStatus.IN_CONSULTATION,
        },
      });

      return created;
    });

    await this.auditService.log({
      userId,
      module: 'encounters',
      action: 'create',
      entityName: 'Encounter',
      entityId: encounter.id,
      newValues: encounter,
    });

    return this.findByAppointment(appointmentId);
  }


         async findByAppointment(appointmentId: string) {
    const encounter = await this.prisma.encounter.findUnique({
      where: { appointmentId },
      include: {
        appointment: {
          include: {
            patient: true,
            doctor: true,
            department: true,
            triage: true,
          },
        },
        patient: true,
        doctor: true,
        diagnoses: true,
        clinicalNotes: true,
        prescriptions: {
          include: {
            items: {
              include: {
                medication: true,
              },
            },
          },
        },
        labOrders: {
          include: {
            items: {
              include: {
                labTestType: true,
                result: true,
              },
            },
          },
        },
      },
    });

    if (!encounter) {
      throw new NotFoundException('Atendimento clínico não encontrado para esta consulta');
    }

    return encounter;
  }

          async update(appointmentId: string, dto: UpdateEncounterDto, userId: string) {
    const existing = await this.prisma.encounter.findUnique({
      where: { appointmentId },
    });

    if (!existing) {
      throw new NotFoundException('Atendimento clínico não encontrado para esta consulta');
    }

    if (existing.status === EncounterStatus.CLOSED) {
      throw new BadRequestException('Não é possível alterar um atendimento fechado');
    }

    const updated = await this.prisma.encounter.update({
      where: { appointmentId },
      data: {
        chiefComplaint: dto.chiefComplaint,
        historyOfPresentIllness: dto.historyOfPresentIllness,
        physicalExam: dto.physicalExam,
        assessment: dto.assessment,
        plan: dto.plan,
      },
    });

                   await this.auditService.log({
      userId,
      module: 'encounters',
      action: 'update',
      entityName: 'Encounter',
      entityId: updated.id,
      oldValues: existing,
      newValues: updated,
    });

    return this.findByAppointment(appointmentId);
  }

  async addDiagnosis(appointmentId: string, dto: AddDiagnosisDto, userId: string) {
    const encounter = await this.prisma.encounter.findUnique({
      where: { appointmentId },
    });

            if (!encounter) {
      throw new NotFoundException('Atendimento clínico não encontrado para esta consulta');
    }

    if (encounter.status === EncounterStatus.CLOSED) {
      throw new BadRequestException('Não é possível adicionar diagnóstico a um atendimento fechado');
    }

    const diagnosis = await this.prisma.diagnosis.create({
      data: {
        encounterId: encounter.id,
        recordedById: userId,
        diagnosisCode: dto.diagnosisCode,
        diagnosisName: dto.diagnosisName,
        type: dto.type,
        notes: dto.notes,
      },
    });

    await this.auditService.log({
      userId,
      module: 'encounters',
      action: 'add_diagnosis',
      entityName: 'Diagnosis',
      entityId: diagnosis.id,
      newValues: diagnosis,
    });

           return this.findByAppointment(appointmentId);
  }

  async addClinicalNote(appointmentId: string, dto: AddClinicalNoteDto, userId: string) {
    const encounter = await this.prisma.encounter.findUnique({
      where: { appointmentId },
    });

    if (!encounter) {
      throw new NotFoundException('Atendimento clínico não encontrado para esta consulta');
    }

    if (encounter.status === EncounterStatus.CLOSED) {
      throw new BadRequestException('Não é possível adicionar nota clínica a um atendimento fechado');
    }

    const note = await this.prisma.clinicalNote.create({
      data: {
        encounterId: encounter.id,
        title: dto.title,
        content: dto.content,
      },
    });


            await this.auditService.log({
      userId,
      module: 'encounters',
      action: 'add_note',
      entityName: 'ClinicalNote',
      entityId: note.id,
      newValues: note,
    });

    return this.findByAppointment(appointmentId);
  }

  async close(appointmentId: string, summary: string | undefined, userId: string) {
    const encounter = await this.prisma.encounter.findUnique({
      where: { appointmentId },
    });

    if (!encounter) {
      throw new NotFoundException('Atendimento clínico não encontrado para esta consulta');
    }

           if (encounter.status === EncounterStatus.CLOSED) {
      throw new BadRequestException('Este atendimento já está fechado');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const closedEncounter = await tx.encounter.update({
        where: { appointmentId },
        data: {
          status: EncounterStatus.CLOSED,
          plan: summary ? `${encounter.plan ?? ''}\n\nResumo de fecho:\n${summary}`.trim() : encounter.plan,
        },
      });

      await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          status: AppointmentStatus.COMPLETED,
        },
      });

      return closedEncounter;
    });


            await this.auditService.log({
      userId,
      module: 'encounters',
      action: 'close',
      entityName: 'Encounter',
      entityId: updated.id,
      oldValues: encounter,
      newValues: updated,
    });

    return this.findByAppointment(appointmentId);
  }
}

            
