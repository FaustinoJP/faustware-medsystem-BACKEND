import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(dto: CreateAuditLogDto) {
    return this.prisma.auditLog.create({
      data: {
        userId: dto.userId,
        module: dto.module,
        action: dto.action,
        entityName: dto.entityName,
        entityId: dto.entityId,
        oldValues: dto.oldValues as any,
        newValues: dto.newValues as any,
        ipAddress: dto.ipAddress,
      },
    });
  }
}


// ============================================================
// PATCH EM src/app.module.ts
// ============================================================
// Adicionar imports:
// import { AppointmentsModule } from './appointments/appointments.module';
// import { TriagesModule } from './triages/triages.module';
// import { EncountersModule } from './encounters/encounters.module';
// import { AuditModule } from './audit/audit.module';
//
// E nos imports do módulo:
// AuditModule,
// AppointmentsModule,
// TriagesModule,
// EncountersModule,

// ============================================================
// EXEMPLOS DE ROTAS
// ============================================================
// POST   /api/v1/appointments
// GET    /api/v1/appointments
// GET    /api/v1/appointments/:id
// PATCH  /api/v1/appointments/:id
// PATCH  /api/v1/appointments/:id/status
//
// POST   /api/v1/appointments/:appointmentId/triage
// GET    /api/v1/appointments/:appointmentId/triage
// PATCH  /api/v1/appointments/:appointmentId/triage
//
// POST   /api/v1/appointments/:appointmentId/encounter
// GET    /api/v1/appointments/:appointmentId/encounter
// PATCH  /api/v1/appointments/:appointmentId/encounter
// POST   /api/v1/appointments/:appointmentId/encounter/diagnoses
// POST   /api/v1/appointments/:appointmentId/encounter/notes
// PATCH  /api/v1/appointments/:appointmentId/encounter/close
