import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Faustino' })
  @IsString()
  lastName: string;

  @ApiProperty({ enum: Gender, example: Gender.MALE })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ example: '1990-05-20' })
  @IsDateString()
  dateOfBirth: string;

  @ApiPropertyOptional({ enum: MaritalStatus, example: MaritalStatus.SINGLE })
  @IsOptional()
  @IsEnum(MaritalStatus)
  maritalStatus?: MaritalStatus;

  @ApiPropertyOptional({ example: 'O+' })
  @IsOptional()
  @IsString()
  bloodGroup?: string;

  @ApiPropertyOptional({ example: '003456789LA042' })
  @IsOptional()
  @IsString()
  nationalId?: string;

  @ApiPropertyOptional({ example: '+244900000000' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'patient@email.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'Luanda, Talatona' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Maria Faustino' })
  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @ApiPropertyOptional({ example: '+244923000000' })
  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;

  @ApiPropertyOptional({ example: 'cmb123456789' })
  @IsOptional()
  @IsString()
  insurerId?: string;
}
