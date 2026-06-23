import { Injectable, Logger } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { CitaEvent } from './cita.events';

/**
 * ARQUITECTURA EVENT DRIVEN — Bus de eventos con RxJS Subject.
 *
 * Implementa el patrón Publicación/Suscripción (Pub/Sub):
 * - PRODUCTORES llaman a emit() sin saber quién escucha
 * - CONSUMIDORES llaman a on() para reaccionar a eventos específicos
 *
 * RxJS (ya incluido en NestJS) se usa como backbone asíncrono.
 * En producción se reemplazaría por Apache Kafka o RabbitMQ,
 * pero la interfaz de CitasService y consumidores NO cambiaría (DIP).
 *
 * PRINCIPIO SRP: esta clase tiene UNA responsabilidad — enrutar eventos.
 * PRINCIPIO DRY: centraliza el mecanismo de eventos en un solo lugar.
 */
@Injectable()
export class EventBusService {
  private readonly logger = new Logger(EventBusService.name);

  // Subject privado: solo EventBusService puede emitir
  private readonly subject$ = new Subject<CitaEvent>();

  // Observable público: cualquier suscriptor puede leer
  readonly eventos$: Observable<CitaEvent> = this.subject$.asObservable();

  /**
   * Emite un evento al bus. Método del PRODUCTOR.
   * Fire-and-forget: no espera a que los consumidores terminen.
   */
  emit(evento: CitaEvent): void {
    this.logger.debug(`[EventBus] Evento emitido → ${evento.tipo}`);
    this.subject$.next(evento);
  }

  /**
   * Devuelve un Observable filtrado por tipo de evento. Método del CONSUMIDOR.
   * Permite que cada consumidor solo reciba los eventos que le interesan (ISP).
   */
  on<T extends CitaEvent>(tipo: T['tipo']): Observable<T> {
    return this.eventos$.pipe(
      filter((e): e is T => e.tipo === tipo),
      map(e => e as T),
    );
  }
}
