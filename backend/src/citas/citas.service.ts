import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { AuditoriaService } from '../auditoria/auditoria.service';

@Injectable()
export class CitasService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly notificacionesService: NotificacionesService,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  private audit(accion: string, registro_id: string, detalles: any) {
    this.auditoriaService.create({ accion, tabla: 'citas', registro_id, detalles }).catch(() => {});
  }

  async findAll(doctorId?: string, pacienteId?: string) {
    try {
      let query = this.supabaseService.client
        .from('citas')
        .select('id, doctor_id, paciente_id, fecha, hora_inicio, hora_fin, estado, motivo, notas, motivo_cancelacion, creado_por, creado_en, doctores(perfiles(nombre_completo), especialidades(nombre)), pacientes(perfiles(nombre_completo, correo))')
        .order('fecha', { ascending: false });

      if (doctorId)   query = query.eq('doctor_id', doctorId);
      if (pacienteId) query = query.eq('paciente_id', pacienteId);

      const { data, error } = await query;
      if (error) throw new BadRequestException(error.message);
      return data;
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException(err.message || 'Error interno del servidor');
    }
  }

  async create(body: any) {
    try {
      const { doctor_id, paciente_id, fecha, hora_inicio, hora_fin, motivo, notas, creado_por } = body;
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
          hora_fin:  hora_fin  || null,
          motivo:    motivo    || null,
          notas:     notas     || null,
          creado_por: creado_por || null,
          estado: 'pendiente',
        })
        .select()
        .single();

      if (error) throw new BadRequestException(error.message);
      this.audit('insert', String(data.id), { doctor_id, paciente_id, fecha, hora_inicio, estado: 'pendiente' });
      return data;
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException(err.message || 'Error interno del servidor');
    }
  }

  async update(id: string, body: any) {
    try {
      const { estado, motivo, hora_inicio, hora_fin, fecha, notas, motivo_cancelacion } = body;
      const updateData: Record<string, any> = {};
      if (estado              !== undefined) updateData.estado              = estado;
      if (motivo              !== undefined) updateData.motivo              = motivo;
      if (hora_inicio         !== undefined) updateData.hora_inicio         = hora_inicio;
      if (hora_fin            !== undefined) updateData.hora_fin            = hora_fin;
      if (fecha               !== undefined) updateData.fecha               = fecha;
      if (notas               !== undefined) updateData.notas               = notas;
      if (motivo_cancelacion  !== undefined) updateData.motivo_cancelacion  = motivo_cancelacion;

      const { data, error } = await this.supabaseService.client
        .from('citas').update(updateData).eq('id', id).select().single();

      if (error) throw new BadRequestException(error.message);
      this.audit('update', id, updateData);
      return data;
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException(err.message || 'Error interno del servidor');
    }
  }

  async cancelar(id: string, motivo?: string) {
    try {
      // Cargar cita con relaciones para notificar al doctor
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
      if (doctorUserId) {
        const pacNombre = (cita as any).pacientes?.perfiles?.nombre_completo ?? 'Un paciente';
        const hora = String((cita as any).hora_inicio ?? '').substring(0, 5);
        this.notificacionesService.create({
          usuario_id: doctorUserId,
          titulo:  'Cita cancelada por el paciente',
          mensaje: `${pacNombre} canceló su cita del ${(cita as any).fecha} a las ${hora}.${motivo ? ` Motivo: ${motivo}` : ''}`,
          tipo:    'cancelacion',
        }).catch(e => console.error('[Citas] Error notif. doctor cancelar:', e?.message));
      }

      return data;
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException(err.message || 'Error interno del servidor');
    }
  }

  async reagendar(id: string, nueva_fecha: string, nueva_hora_inicio: string, duracion_cita: number) {
    try {
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

      // Verificar disponibilidad del slot
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

      // Calcular hora_fin
      const dur = duracion_cita || 30;
      const [h, m] = nueva_hora_inicio.split(':').map(Number);
      const finMin = h * 60 + m + dur;
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
      if (doctorUserId) {
        const pacNombre = (cita as any).pacientes?.perfiles?.nombre_completo ?? 'Un paciente';
        this.notificacionesService.create({
          usuario_id: doctorUserId,
          titulo:  'Cita reagendada por el paciente',
          mensaje: `${pacNombre} reagendó su cita para el ${nueva_fecha} a las ${nueva_hora_inicio}.`,
          tipo:    'confirmacion',
        }).catch(e => console.error('[Citas] Error notif. doctor reagendar:', e?.message));
      }

      return data;
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException(err.message || 'Error interno del servidor');
    }
  }

  async remove(id: string) {
    try {
      const { error } = await this.supabaseService.client.from('citas').delete().eq('id', id);
      if (error) throw new BadRequestException(error.message);
      return { success: true };
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException(err.message || 'Error interno del servidor');
    }
  }
}
