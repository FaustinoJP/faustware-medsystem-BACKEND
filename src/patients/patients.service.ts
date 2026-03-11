import { Injectable, NotFoundException } from '@nestjs/common';
            { phone: { contains: search, mode: 'insensitive' } },
            { nationalId: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    return this.prisma.patient.findMany({
      where,
      include: {
        insurer: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        insurer: true,
        contacts: true,
        documents: true,
        allergies: true,
        chronicConditions: true,
        appointments: {
          orderBy: { appointmentDate: 'desc' },
          take: 10,
        },
      },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado');
    }

    return patient;
  }

  async update(id: string, dto: UpdatePatientDto, userId?: string) {
    await this.ensureExists(id);

    return this.prisma.patient.update({
      where: { id },
      data: {
        ...dto,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        updatedById: userId,
      },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);

    return this.prisma.patient.delete({
      where: { id },
    });
  }

  private async ensureExists(id: string) {
    const patient = await this.prisma.patient.findUnique({ where: { id } });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado');
    }

    return patient;
  }

  private async generatePatientCode() {
    const year = new Date().getFullYear();
    const count = await this.prisma.patient.count();
    const next = String(count + 1).padStart(6, '0');
    return `PAT-${year}-${next}`;
  }
}
