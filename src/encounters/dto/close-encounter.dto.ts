import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CloseEncounterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  summary?: string;
}
