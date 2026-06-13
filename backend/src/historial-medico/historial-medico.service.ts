import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { AuditoriaService } from '../auditoria/auditoria.service';

@Injectable()
export class HistorialMedicoService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly notificacionesService: NotificacionesService,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  private audit(accion: string, registro_id: string, detalles: any) {
    this.auditoriaService.create({ accion, tabla: 'historial_medico', registro_id, detalles }).catch(() => {});
  }

  async findAll(pacienteId?: string, doctorId?: string) {
    try {
      let query = this.supabaseService.client
        .from('historial_medico')
        .select(`
          *,
          recetas(*),
          doctores(perfiles(nombre_completo), especialidades(nombre))
        `)
        .order('fecha_registro', { ascending: false });

      if (pacienteId) query = query.eq('paciente_id', pacienteId);
      if (doctorId) query = query.eq('doctor_id', doctorId);

      const { data, error } = await query;
      if (error) throw new BadRequestException(error.message);
      return data;
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException(err.message);
    }
  }

  async findOne(id: string) {
    try {
      const { data, error } = await this.supabaseService.client
        .from('historial_medico')
        .select('*, recetas(*), doctores(perfiles(nombre_completo), especialidades(nombre))')
        .eq('id', id)
        .single();
      if (error) throw new BadRequestException(error.message);
      return data;
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException(err.message);
    }
  }

  async create(body: any) {
    try {
      const { paciente_id, doctor_id, cita_id, sintomas, diagnostico, tratamiento, observaciones } = body;
      if (!paciente_id || !doctor_id) {
        throw new BadRequestException('paciente_id y doctor_id son requeridos');
      }

      const { data, error } = await this.supabaseService.client
        .from('historial_medico')
        .insert({ paciente_id, doctor_id, cita_id: cita_id || null, sintomas, diagnostico, tratamiento, observaciones })
        .select()
        .single();
      if (error) throw new BadRequestException(error.message);

      this.audit('insert', String(data.id), { paciente_id, doctor_id, cita_id, diagnostico });

      this.notificarPaciente(paciente_id, doctor_id, { diagnostico, tratamiento, sintomas })
        .catch(e => console.error('[Historial] notificarPaciente excepción:', e?.message ?? e));

      return data;
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException(err.message);
    }
  }

  private async notificarPaciente(
    pacienteId: string,
    doctorId: string,
    historial: { diagnostico?: string; tratamiento?: string; sintomas?: string },
  ) {
    console.log('[Notif] Iniciando notificación → paciente_id:', pacienteId);

    // Obtener el usuario_id del paciente (perfil_id = auth UUID)
    const { data: pac, error: errPac } = await this.supabaseService.client
      .from('pacientes')
      .select('perfil_id')
      .eq('id', pacienteId)
      .maybeSingle();

    if (errPac) { console.error('[Notif] Error buscando paciente:', errPac.message); return; }
    if (!pac)   { console.error('[Notif] Paciente no encontrado, id:', pacienteId); return; }

    const usuarioId = (pac as any).perfil_id as string | null;
    if (!usuarioId) { console.error('[Notif] perfil_id es NULL para paciente:', pacienteId); return; }

    // Obtener nombre del doctor
    const { data: doc } = await this.supabaseService.client
      .from('doctores')
      .select('perfiles(nombre_completo)')
      .eq('id', doctorId)
      .maybeSingle();

    const nombreDoctor = (doc as any)?.perfiles?.nombre_completo ?? 'Tu médico';

    // Armar mensaje con el contenido clínico
    const partes: string[] = [];
    if (historial.diagnostico) partes.push(`Diagnóstico: ${historial.diagnostico}`);
    if (historial.tratamiento) partes.push(`Tratamiento: ${historial.tratamiento}`);
    if (historial.sintomas)    partes.push(`Síntomas: ${historial.sintomas}`);

    const mensaje = partes.length > 0
      ? `${partes.join('\n')}\n\nRevísalo en la pestaña "Historial" de la app.`
      : 'Entra a la pestaña "Historial" de la app para ver los detalles.';

    // Usar NotificacionesService (mismo flujo que funciona para el resto de notificaciones)
    try {
      await this.notificacionesService.create({
        usuario_id: usuarioId,
        titulo: `${nombreDoctor} registró tu historial clínico`,
        mensaje,
        tipo: 'resultado',
      });
      console.log('[Notif] ✓ Notificación enviada a usuario_id:', usuarioId);
    } catch (e: any) {
      console.error('[Notif] Error al crear notificación:', e?.message ?? e);
    }
  }

  async update(id: string, body: any) {
    try {
      const { sintomas, diagnostico, tratamiento, observaciones } = body;
      const updateData: Record<string, any> = {};
      if (sintomas !== undefined) updateData.sintomas = sintomas;
      if (diagnostico !== undefined) updateData.diagnostico = diagnostico;
      if (tratamiento !== undefined) updateData.tratamiento = tratamiento;
      if (observaciones !== undefined) updateData.observaciones = observaciones;

      const { data, error } = await this.supabaseService.client
        .from('historial_medico')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw new BadRequestException(error.message);
      this.audit('update', id, updateData);
      return data;
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException(err.message);
    }
  }

  async remove(id: string) {
    try {
      const { error } = await this.supabaseService.client
        .from('historial_medico')
        .delete()
        .eq('id', id);
      if (error) throw new BadRequestException(error.message);
      return { success: true };
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException(err.message);
    }
  }

  // --- Recetas ---

  async findRecetas(historialId: string) {
    try {
      const { data, error } = await this.supabaseService.client
        .from('recetas')
        .select('*')
        .eq('historial_id', historialId)
        .order('creado_en', { ascending: false });
      if (error) throw new BadRequestException(error.message);
      return data;
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException(err.message);
    }
  }

  async createReceta(body: any) {
    try {
      const { historial_id, medicamento, dosis, frecuencia, duracion, instrucciones } = body;
      if (!historial_id || !medicamento) {
        throw new BadRequestException('historial_id y medicamento son requeridos');
      }

      const { data, error } = await this.supabaseService.client
        .from('recetas')
        .insert({ historial_id, medicamento, dosis, frecuencia, duracion, instrucciones })
        .select()
        .single();
      if (error) throw new BadRequestException(error.message);
      return data;
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException(err.message);
    }
  }

  async updateReceta(id: string, body: any) {
    try {
      const { medicamento, dosis, frecuencia, duracion, instrucciones } = body;
      const updateData: Record<string, any> = {};
      if (medicamento !== undefined) updateData.medicamento = medicamento;
      if (dosis !== undefined) updateData.dosis = dosis;
      if (frecuencia !== undefined) updateData.frecuencia = frecuencia;
      if (duracion !== undefined) updateData.duracion = duracion;
      if (instrucciones !== undefined) updateData.instrucciones = instrucciones;

      const { data, error } = await this.supabaseService.client
        .from('recetas')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw new BadRequestException(error.message);
      return data;
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException(err.message);
    }
  }

  async removeReceta(id: string) {
    try {
      const { error } = await this.supabaseService.client
        .from('recetas')
        .delete()
        .eq('id', id);
      if (error) throw new BadRequestException(error.message);
      return { success: true };
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException(err.message);
    }
  }
}
