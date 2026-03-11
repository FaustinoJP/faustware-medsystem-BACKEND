import { Module } from '@nestjs/common';
import { TriagesController } from './triages.controller';
import { TriagesService } from './triages.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [TriagesController],
  providers: [TriagesService],
  exports: [TriagesService],
})
export class TriagesModule {}
