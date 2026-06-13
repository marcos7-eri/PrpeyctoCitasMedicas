import { Module } from '@nestjs/common';
import { HistorialMedicoController } from './historial-medico.controller';
import { HistorialMedicoService } from './historial-medico.service';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';

@Module({
  imports: [NotificacionesModule, AuditoriaModule],
  controllers: [HistorialMedicoController],
  providers: [HistorialMedicoService],
  exports: [HistorialMedicoService],
})
export class HistorialMedicoModule {}
