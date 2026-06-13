import { Module } from '@nestjs/common';
import { CitasController } from './citas.controller';
import { CitasService } from './citas.service';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';

@Module({
  imports: [NotificacionesModule, AuditoriaModule],
  controllers: [CitasController],
  providers: [CitasService],
})
export class CitasModule {}
