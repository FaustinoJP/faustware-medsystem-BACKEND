import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AddClinicalNoteDto } from './dto/add-clinical-note.dto';
import { AddDiagnosisDto } from './dto/add-diagnosis.dto';
import { CloseEncounterDto } from './dto/close-encounter.dto';
import { CreateEncounterDto } from './dto/create-encounter.dto';
import { UpdateEncounterDto } from './dto/update-encounter.dto';
import { EncountersService } from './encounters.service';

@ApiTags('Encounters')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('appointments/:appointmentId/encounter')
export class EncountersController {
  constructor(private readonly encountersService: EncountersService) {}

  @Post()
  create(
    @Param('appointmentId') appointmentId: string,
    @Body() dto: CreateEncounterDto,
    @CurrentUser() user: any,
  ) {
    return this.encountersService.create(appointmentId, dto, user.sub);
  }

  @Get()
  findOne(@Param('appointmentId') appointmentId: string) {
    return this.encountersService.findByAppointment(appointmentId);
  }

  @Patch()
  update(
    @Param('appointmentId') appointmentId: string,
    @Body() dto: UpdateEncounterDto,
    @CurrentUser() user: any,
  ) {
    return this.encountersService.update(appointmentId, dto, user.sub);
  }

  @Post('diagnoses')
  addDiagnosis(
    @Param('appointmentId') appointmentId: string,
    @Body() dto: AddDiagnosisDto,
    @CurrentUser() user: any,
  ) {
    return this.encountersService.addDiagnosis(appointmentId, dto, user.sub);
  }

  @Post('notes')
  addClinicalNote(
    @Param('appointmentId') appointmentId: string,
    @Body() dto: AddClinicalNoteDto,
    @CurrentUser() user: any,
  ) {
    return this.encountersService.addClinicalNote(appointmentId, dto, user.sub);
  }

  @Patch('close')
  close(
    @Param('appointmentId') appointmentId: string,
    @Body() dto: CloseEncounterDto,
    @CurrentUser() user: any,
  ) {
    return this.encountersService.close(appointmentId, dto.summary, user.sub);
  }
}
