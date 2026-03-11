import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Route } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class AddPrescriptionItemDto {
  @ApiProperty()
  @IsString()
  medicationId: string;

  @ApiProperty({ example: '500 mg' })
  @IsString()
  dosage: string;

  @ApiProperty({ example: '3x ao dia' })
  @IsString()
  frequency: string;

  @ApiProperty({ example: '7 dias' })
  @IsString()
  duration: string;

  @ApiProperty({ enum: Route, default: Route.ORAL })
  @IsEnum(Route)
  route: Route;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instructions?: string;
}
