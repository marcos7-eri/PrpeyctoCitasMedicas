import { Module } from '@nestjs/common';
import { DoctoresController } from './doctores.controller';
import { DoctoresService } from './doctores.service';
import { AuditoriaModule } from '../auditoria/auditoria.module';

@Module({
  imports: [AuditoriaModule],
  controllers: [DoctoresController],
  providers: [DoctoresService],
})
export class DoctoresModule {}
