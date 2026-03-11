import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
