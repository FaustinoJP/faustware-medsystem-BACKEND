import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateTriageDto {
  @ApiPropertyOptional()
  @IsOptional()
  weight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  height?: number;

  @ApiPropertyOptional()
  @IsOptional()
  temperature?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bloodPressure?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  heartRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  respiratoryRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  oxygenSaturation?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
