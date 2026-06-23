import { Global, Module } from '@nestjs/common';
import { EventBusService } from './event-bus.service';

/**
 * ARQUITECTURA EVENT DRIVEN + MICROSERVICES (módulo):
 *
 * @Global() hace que EventBusService esté disponible en TODOS los módulos
 * sin necesidad de importar EventsModule en cada uno — el bus de eventos
 * es infraestructura transversal, como un canal de comunicación compartido.
 *
 * ARQUITECTURA LAYERED: EventsModule pertenece a la capa de infraestructura,
 * separada de la lógica de negocio (services) y la capa de presentación (controllers).
 *
 * ARQUITECTURA MICROSERVICES: cada módulo NestJS (CitasModule, NotificacionesModule, etc.)
 * es autónomo y se comunica ÚNICAMENTE a través del EventBusService,
 * reflejando el principio de independencia de los microservicios.
 */
@Global()
@Module({
  providers: [EventBusService],
  exports:   [EventBusService],
})
export class EventsModule {}
