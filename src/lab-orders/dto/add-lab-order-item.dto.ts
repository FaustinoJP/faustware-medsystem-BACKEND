import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AddLabOrderItemDto {
  @ApiProperty()
  @IsString()
  labTestTypeId: string;
}
