import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { EventBusService } from '../events/event-bus.service';
import { handleDbOperation } from '../common/db-error-handler';
import { ICitasService } from '../interfaces/ICitasService';
import {
  CitaCreadaEvent,
  CitaConfirmadaEvent,
  CitaCompletadaEvent,
  CitaCanceladaEvent,
  CitaReagendadaEvent,
} from '../events/cita.events';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * PRINCIPIOS Y ARQUITECTURAS APLICADOS EN ESTA CLASE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ARQUITECTURA LAYERED (En Capas):
 *   CitasService pertenece a la capa de LÓGICA DE NEGOCIO.
 *   Recibe solicitudes del Controller (capa de presentación) y
 *   delega acceso a datos a SupabaseService (capa de datos).
 *   Las capas solo se comunican hacia abajo, nunca saltando niveles.
 *
 * ARQUITECTURA EVENT DRIVEN:
 *   Después de cada cambio de estado, CitasService emite un evento
 *   al EventBusService. Los consumidores reaccionan de forma DESACOPLADA
 *   — CitasService no sabe quién escucha ni cuántos consumidores hay.
 *
 * PRINCIPIO SRP (Single Responsibility Principle):
 *   CitasService tiene UNA razón para cambiar: la lógica de negocio de citas.
 *   El manejo de errores está delegado a handleDbOperation (DRY).
 *   La emisión de eventos está delegada a EventBusService.
 *   Las notificaciones están delegadas a NotificacionesService.
 *
 * PRINCIPIO DIP (Dependency Inversion Principle):
 *   CitasService depende de ABSTRACCIONES inyectadas (ICitasService, interfaces),
 *   no de implementaciones concretas. NestJS inyecta las dependencias
 *   por constructor — nunca se instancian con "new" aquí dentro.
 *
 * PRINCIPIO DRY (Don't Repeat Yourself):
 *   Todos los bloques try/catch se unifican en handleDbOperation().
 *   El método privado audit() centraliza la escritura de auditoría.
 *
 * PRINCIPIO YAGNI (You Aren't Gonna Need It):
 *   No se implementa paginación, caché ni soft-delete porque NO están
 *   en los requerimientos actuales. Se añadirán solo si se requieren.
 * ─────────────────────────────────────────────────────────────────────────────
 */
@Injectable()
export class CitasService implements ICitasService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly notificacionesService: NotificacionesService,
    private readonly auditoriaService: AuditoriaService,
    // DIP: se inyecta la abstracción EventBusService, no un Subject de RxJS directamente
    private readonly eventBus: EventBusService,
  ) {}

  // ─── DRY: método privado único para registrar auditoría ──────────────────
  private audit(accion: string, registro_id: string, detalles: any) {
    this.auditoriaService
      .create({ accion, tabla: 'citas', registro_id, detalles })
      .catch(() => {});
  }

  // ─── CRUD Base ────────────────────────────────────────────────────────────

  async findAll(doctorId?: string, pacienteId?: string): Promise<any[]> {
    // DRY: handleDbOperation reemplaza el bloque try/catch repetido en cada método
    return handleDbOperation(async () => {
      let query = this.supabaseService.client
        .from('citas')
        .select(
          'id, doctor_id, paciente_id, fecha, hora_inicio, hora_fin, estado, motivo, notas, ' +
          'motivo_cancelacion, creado_por, creado_en, ' +
          'doctores(perfiles(nombre_completo), especialidades(nombre)), ' +
          'pacientes(perfiles(nombre_completo, correo))',
        )
        .order('fecha', { ascending: false });

      if (doctorId)   query = query.eq('doctor_id',   doctorId);
      if (pacienteId) query = query.eq('paciente_id', pacienteId);

      const { data, error } = await query;
      if (error) throw new BadRequestException(error.message);
      return data ?? [];
    });
  }

  async create(body: any): Promise<any> {
    return handleDbOperation(async () => {
      const { doctor_id, paciente_id, fecha, hora_inicio, hora_fin, motivo, notas, creado_por } = body;

      // SRP: la validación de entrada pertenece a la responsabilidad de este método
      if (!doctor_id || !paciente_id || !fecha || !hora_inicio) {
        throw new BadRequestException('doctor_id, paciente_id, fecha y hora_inicio son requeridos');
      }

      const { data, error } = await this.supabaseService.client
        .from('citas')
        .insert({
          doctor_id,
          paciente_id,
          fecha,
          hora_inicio,
          hora_fin:   hora_fin   || null,
          motivo:     motivo     || null,
          notas:      notas      || null,
          creado_por: creado_por || null,
          estado:     'pendiente',
        })
        .select()
        .single();

      if (error) throw new BadRequestException(error.message);

      // DRY: centralizado en método privado audit()
      this.audit('insert', String(data.id), { doctor_id, paciente_id, fecha, hora_inicio, estado: 'pendiente' });

      // EVENT DRIVEN: emitir evento de dominio — los consumidores reaccionan sin que CitasService lo sepa
      this.eventBus.emit(new CitaCreadaEvent(String(data.id), doctor_id, paciente_id, fecha));

      return data;
    });
  }

  async update(id: string, body: any): Promise<any> {
    return handleDbOperation(async () => {
      const { estado, motivo, hora_inicio, hora_fin, fecha, notas, motivo_cancelacion } = body;
      const updateData: Record<string, any> = {};
      if (estado             !== undefined) updateData.estado             = estado;
      if (motivo             !== undefined) updateData.motivo             = motivo;
      if (hora_inicio        !== undefined) updateData.hora_inicio        = hora_inicio;
      if (hora_fin           !== undefined) updateData.hora_fin           = hora_fin;
      if (fecha              !== undefined) updateData.fecha              = fecha;
      if (notas              !== undefined) updateData.notas              = notas;
      if (motivo_cancelacion !== undefined) updateData.motivo_cancelacion = motivo_cancelacion;

      const { data, error } = await this.supabaseService.client
        .from('citas').update(updateData).eq('id', id).select().single();

      if (error) throw new BadRequestException(error.message);
      this.audit('update', id, updateData);
      return data;
    });
  }

  async confirmar(id: string): Promise<any> {
    return handleDbOperation(async () => {
      const { data: cita, error: errCita } = await this.supabaseService.client
        .from('citas')
        .select('id, fecha, hora_inicio, estado, pacientes(perfil_id, perfiles(nombre_completo)), doctores(perfiles(nombre_completo))')
        .eq('id', id)
        .single();

      if (errCita || !cita) throw new BadRequestException(`Cita no encontrada (id=${id})`);
      if ((cita as any).estado !== 'pendiente') {
        throw new BadRequestException(
          `La cita tiene estado "${(cita as any).estado}", solo se pueden confirmar citas pendientes`,
        );
      }

      const { data, error } = await this.supabaseService.client
        .from('citas').update({ estado: 'confirmada' }).eq('id', id).select().single();
      if (error) throw new BadRequestException(error.message);

      this.audit('update', id, { estado: 'confirmada' });

      const pacUserId = (cita as any).pacientes?.perfil_id;
      const docNombre = (cita as any).doctores?.perfiles?.nombre_completo ?? 'Tu doctor';
      const hora      = String((cita as any).hora_inicio ?? '').substring(0, 5);
      const fecha     = (cita as any).fecha;

      if (pacUserId) {
        // Notificación directa — capa de negocio existente (se mantiene intacta)
        this.notificacionesService.create({
          usuario_id: pacUserId,
          titulo:  'Cita confirmada',
          mensaje: `${docNombre} confirmó tu cita del ${fecha} a las ${hora}.`,
          tipo:    'confirmacion',
        }).catch(() => {});

        // EVENT DRIVEN: productores emiten, consumidores reaccionan de forma desacoplada
        this.eventBus.emit(new CitaConfirmadaEvent(id, pacUserId, docNombre, fecha, hora));
      }

      return data;
    });
  }

  async completar(id: string): Promise<any> {
    return handleDbOperation(async () => {
      const { data: cita, error: errCita } = await this.supabaseService.client
        .from('citas')
        .select('id, fecha, hora_inicio, estado, pacientes(perfil_id, perfiles(nombre_completo)), doctores(perfiles(nombre_completo))')
        .eq('id', id)
        .single();

      if (errCita || !cita) throw new BadRequestException('Cita no encontrada');
      if (!['pendiente', 'confirmada'].includes((cita as any).estado)) {
        throw new BadRequestException('Solo se pueden completar citas pendientes o confirmadas');
      }

      const { data, error } = await this.supabaseService.client
        .from('citas').update({ estado: 'completada' }).eq('id', id).select().single();
      if (error) throw new BadRequestException(error.message);

      this.audit('update', id, { estado: 'completada' });

      const pacUserId = (cita as any).pacientes?.perfil_id;
      const docNombre = (cita as any).doctores?.perfiles?.nombre_completo ?? 'Tu doctor';
      const hora      = String((cita as any).hora_inicio ?? '').substring(0, 5);
      const fecha     = (cita as any).fecha;

      if (pacUserId) {
        this.notificacionesService.create({
          usuario_id: pacUserId,
          titulo:  'Cita completada',
          mensaje: `Tu cita con ${docNombre} del ${fecha} a las ${hora} fue marcada como completada.`,
          tipo:    'confirmacion',
        }).catch(() => {});

        this.eventBus.emit(new CitaCompletadaEvent(id, pacUserId, docNombre, fecha, hora));
      }

      return data;
    });
  }

  async cancelar(id: string, motivo?: string): Promise<any> {
    return handleDbOperation(async () => {
      const { data: cita, error: errCita } = await this.supabaseService.client
        .from('citas')
        .select(`
          id, doctor_id, fecha, hora_inicio, estado,
          pacientes(perfil_id, perfiles(nombre_completo)),
          doctores(perfil_id, perfiles(nombre_completo))
        `)
        .eq('id', id)
        .single();

      if (errCita || !cita) throw new BadRequestException('Cita no encontrada');
      if (!['pendiente', 'confirmada'].includes((cita as any).estado)) {
        throw new BadRequestException('Solo se pueden cancelar citas pendientes o confirmadas');
      }

      const { data, error } = await this.supabaseService.client
        .from('citas')
        .update({ estado: 'cancelada', motivo_cancelacion: motivo || null })
        .eq('id', id)
        .select()
        .single();
      if (error) throw new BadRequestException(error.message);

      this.audit('update', id, { estado: 'cancelada', motivo_cancelacion: motivo || null });

      const doctorUserId = (cita as any).doctores?.perfil_id;
      const pacNombre    = (cita as any).pacientes?.perfiles?.nombre_completo ?? 'Un paciente';
      const hora         = String((cita as any).hora_inicio ?? '').substring(0, 5);
      const fecha        = (cita as any).fecha;

      if (doctorUserId) {
        this.notificacionesService.create({
          usuario_id: doctorUserId,
          titulo:  'Cita cancelada por el paciente',
          mensaje: `${pacNombre} canceló su cita del ${fecha} a las ${hora}.${motivo ? ` Motivo: ${motivo}` : ''}`,
          tipo:    'cancelacion',
        }).catch(e => console.error('[Citas] Error notif. doctor cancelar:', e?.message));

        this.eventBus.emit(new CitaCanceladaEvent(id, doctorUserId, pacNombre, fecha, hora, motivo));
      }

      return data;
    });
  }

  async reagendar(id: string, nueva_fecha: string, nueva_hora_inicio: string, duracion_cita: number): Promise<any> {
    return handleDbOperation(async () => {
      if (!nueva_fecha || !nueva_hora_inicio) {
        throw new BadRequestException('nueva_fecha y nueva_hora_inicio son requeridos');
      }

      const { data: cita, error: errCita } = await this.supabaseService.client
        .from('citas')
        .select(`
          id, doctor_id, fecha, hora_inicio, estado,
          pacientes(perfil_id, perfiles(nombre_completo)),
          doctores(perfil_id, perfiles(nombre_completo))
        `)
        .eq('id', id)
        .single();

      if (errCita || !cita) throw new BadRequestException('Cita no encontrada');
      if (!['pendiente', 'confirmada'].includes((cita as any).estado)) {
        throw new BadRequestException('Solo se pueden reagendar citas pendientes o confirmadas');
      }

      const { data: ocupadas } = await this.supabaseService.client
        .from('citas')
        .select('hora_inicio')
        .eq('doctor_id', (cita as any).doctor_id)
        .eq('fecha', nueva_fecha)
        .in('estado', ['pendiente', 'confirmada'])
        .neq('id', id);

      const slotOcupado = (ocupadas ?? []).some(
        c => String(c.hora_inicio).substring(0, 5) === nueva_hora_inicio,
      );
      if (slotOcupado) throw new BadRequestException('El horario seleccionado ya está ocupado. Elige otro.');

      // OCP: cálculo de hora_fin encapsulado, sin modificar la lógica de negocio principal
      const dur = duracion_cita || 30;
      const [h, m] = nueva_hora_inicio.split(':').map(Number);
      const finMin  = h * 60 + m + dur;
      const hora_fin = `${String(Math.floor(finMin / 60)).padStart(2, '0')}:${String(finMin % 60).padStart(2, '0')}:00`;

      const { data, error } = await this.supabaseService.client
        .from('citas')
        .update({
          fecha:       nueva_fecha,
          hora_inicio: nueva_hora_inicio + ':00',
          hora_fin,
          estado:      'pendiente',
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw new BadRequestException(error.message);

      this.audit('update', id, { accion: 'reagendar', nueva_fecha, nueva_hora_inicio, estado: 'pendiente' });

      const doctorUserId = (cita as any).doctores?.perfil_id;
      const pacNombre    = (cita as any).pacientes?.perfiles?.nombre_completo ?? 'Un paciente';

      if (doctorUserId) {
        this.notificacionesService.create({
          usuario_id: doctorUserId,
          titulo:  'Cita reagendada por el paciente',
          mensaje: `${pacNombre} reagendó su cita para el ${nueva_fecha} a las ${nueva_hora_inicio}.`,
          tipo:    'confirmacion',
        }).catch(e => console.error('[Citas] Error notif. doctor reagendar:', e?.message));

        this.eventBus.emit(new CitaReagendadaEvent(id, doctorUserId, pacNombre, nueva_fecha, nueva_hora_inicio));
      }

      return data;
    });
  }

  async remove(id: string): Promise<{ success: boolean }> {
    return handleDbOperation(async () => {
      const { error } = await this.supabaseService.client
        .from('citas').delete().eq('id', id);
      if (error) throw new BadRequestException(error.message);
      return { success: true };
    });
  }
}
