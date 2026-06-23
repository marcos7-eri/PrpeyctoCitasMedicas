import { Module } from '@nestjs/common';
import { CitasController } from './citas.controller';
import { CitasService } from './citas.service';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';

/**
 * ARQUITECTURA MICROSERVICES (módulo autónomo):
 * CitasModule encapsula todo lo relacionado con el dominio de citas médicas.
 * Solo exporta lo que otros módulos necesitan — encapsulamiento estricto.
 *
 * PRINCIPIO SRP: este módulo tiene UNA responsabilidad — registrar las
 * dependencias del dominio de citas.
 *
 * NOTA: EventBusService es inyectado automáticamente porque EventsModule
 * está registrado como @Global() en AppModule.
 */
@Module({
  imports: [NotificacionesModule, AuditoriaModule],
  controllers: [CitasController],
  providers: [CitasService],
})
export class CitasModule {}
