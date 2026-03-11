import { Injectable, NotFoundException } from '@nestjs/common';
        notes: dto.notes,
      },
      include: this.includeConfig(),
    });

    await this.auditService.log({
      userId,
      module: 'appointments',
      action: 'update',
      entityName: 'Appointment',
      entityId: updated.id,
      oldValues: existing,
      newValues: updated,
    });

    return updated;
  }

  async updateStatus(id: string, status: AppointmentStatus, userId?: string) {
    const existing = await this.ensureExists(id);

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: { status },
      include: this.includeConfig(),
    });

    await this.auditService.log({
      userId,
      module: 'appointments',
      action: 'status_update',
      entityName: 'Appointment',
      entityId: updated.id,
      oldValues: existing,
      newValues: updated,
    });

    return updated;
  }

  private async ensureExists(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: this.includeConfig(),
    });

    if (!appointment) {
      throw new NotFoundException('Consulta não encontrada');
    }

    return appointment;
  }

  private includeConfig() {
    return {
      patient: true,
      doctor: {
        include: {
          role: true,
          department: true,
        },
      },
      department: true,
      createdBy: {
        include: {
          role: true,
        },
      },
    };
  }
}
