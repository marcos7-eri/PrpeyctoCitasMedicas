import { Module } from '@nestjs/common';
import { NotificacionesController } from './notificaciones.controller';
import { NotificacionesService } from './notificaciones.service';

/**
 * ARQUITECTURA MICROSERVICES (módulo autónomo):
 * NotificacionesModule encapsula el dominio de notificaciones.
 * Exporta NotificacionesService para que CitasModule y otros
 * módulos puedan inyectarlo — respetando la separación de dominios.
 *
 * NOTA: EventBusService se inyecta automáticamente (EventsModule es @Global()).
 * NotificacionesService actúa como CONSUMIDOR del bus de eventos en onModuleInit().
 */
@Module({
  controllers: [NotificacionesController],
  providers:   [NotificacionesService],
  exports:     [NotificacionesService],
})
export class NotificacionesModule {}
