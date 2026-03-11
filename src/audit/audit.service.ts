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
