import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class RegisterPaymentDto {
  @ApiProperty()
  @IsString()
  paymentMethodId: string;

  @ApiProperty({ example: 15000 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  transactionReference?: string;
}
