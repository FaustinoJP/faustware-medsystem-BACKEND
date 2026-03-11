import { PartialType } from '@nestjs/swagger';
import { CreateTriageDto } from './create-triage.dto';

export class UpdateTriageDto extends PartialType(CreateTriageDto) {}
