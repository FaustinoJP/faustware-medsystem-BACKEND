import { PartialType } from '@nestjs/swagger';
import { CreateEncounterDto } from './create-encounter.dto';

export class UpdateEncounterDto extends PartialType(CreateEncounterDto) {}
