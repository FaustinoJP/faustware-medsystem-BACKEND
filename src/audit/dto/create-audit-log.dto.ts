export class CreateAuditLogDto {
  userId?: string;
  module: string;
  action: string;
  entityName: string;
  entityId?: string;
  oldValues?: unknown;
  newValues?: unknown;
  ipAddress?: string;
}
