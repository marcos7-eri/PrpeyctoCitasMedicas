/**
 * ARQUITECTURA EVENT DRIVEN:
 * Clases de evento que representan hechos ocurridos en el dominio de citas.
 *
 * Los PRODUCTORES (CitasService) emiten estas clases al EventBusService.
 * Los CONSUMIDORES (NotificacionesService, AuditoriaService, etc.) se
 * suscriben al bus y reaccionan — sin saber quién produjo el evento.
 *
 * Ventajas demostradas:
 * - Desacoplamiento total entre módulos
 * - Escalabilidad: añadir un nuevo consumidor no modifica a CitasService
 * - Asincronía: los consumidores no bloquean al productor
 *
 * PRINCIPIO OCP: nuevos consumidores de eventos se añaden sin tocar
 * el código de CitasService (abierto para extensión).
 */

export class CitaConfirmadaEvent {
  readonly tipo = 'cita.confirmada';
  constructor(
    public readonly citaId: string,
    public readonly pacienteUserId: string,
    public readonly doctorNombre: string,
    public readonly fecha: string,
    public readonly hora: string,
  ) {}
}

export class CitaCanceladaEvent {
  readonly tipo = 'cita.cancelada';
  constructor(
    public readonly citaId: string,
    public readonly doctorUserId: string,
    public readonly pacienteNombre: string,
    public readonly fecha: string,
    public readonly hora: string,
    public readonly motivo?: string,
  ) {}
}

export class CitaCompletadaEvent {
  readonly tipo = 'cita.completada';
  constructor(
    public readonly citaId: string,
    public readonly pacienteUserId: string,
    public readonly doctorNombre: string,
    public readonly fecha: string,
    public readonly hora: string,
  ) {}
}

export class CitaReagendadaEvent {
  readonly tipo = 'cita.reagendada';
  constructor(
    public readonly citaId: string,
    public readonly doctorUserId: string,
    public readonly pacienteNombre: string,
    public readonly nuevaFecha: string,
    public readonly nuevaHora: string,
  ) {}
}

export class CitaCreadaEvent {
  readonly tipo = 'cita.creada';
  constructor(
    public readonly citaId: string,
    public readonly doctorId: string,
    public readonly pacienteId: string,
    public readonly fecha: string,
  ) {}
}

export type CitaEvent =
  | CitaConfirmadaEvent
  | CitaCanceladaEvent
  | CitaCompletadaEvent
  | CitaReagendadaEvent
  | CitaCreadaEvent;
