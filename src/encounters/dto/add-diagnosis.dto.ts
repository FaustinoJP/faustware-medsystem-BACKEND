import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DiagnosisType } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class AddDiagnosisDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  diagnosisCode?: string;

  @ApiProperty()
  @IsString()
  diagnosisName: string;

  @ApiProperty({ enum: DiagnosisType, default: DiagnosisType.PRIMARY })
  @IsEnum(DiagnosisType)
  type: DiagnosisType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
