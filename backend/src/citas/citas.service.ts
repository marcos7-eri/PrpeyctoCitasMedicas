import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class CitasService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(doctorId?: string, pacienteId?: string) {
    try {
      let query = this.supabaseService.client
        .from('citas')
        .select('id, doctor_id, paciente_id, fecha, hora_inicio, hora_fin, estado, motivo, notas, motivo_cancelacion, creado_por, creado_en, doctores(perfiles(nombre_completo), especialidades(nombre)), pacientes(perfiles(nombre_completo, correo))')
        .order('fecha', { ascending: false });

      if (doctorId) {
        query = query.eq('doctor_id', doctorId);
      }
      if (pacienteId) {
        query = query.eq('paciente_id', pacienteId);
      }

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
          hora_fin: hora_fin || null,
          motivo: motivo || null,
          notas: notas || null,
          creado_por: creado_por || null,
          estado: 'pendiente',
        })
        .select()
        .single();

      if (error) throw new BadRequestException(error.message);
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
      if (estado !== undefined) updateData.estado = estado;
      if (motivo !== undefined) updateData.motivo = motivo;
      if (hora_inicio !== undefined) updateData.hora_inicio = hora_inicio;
      if (hora_fin !== undefined) updateData.hora_fin = hora_fin;
      if (fecha !== undefined) updateData.fecha = fecha;
      if (notas !== undefined) updateData.notas = notas;
      if (motivo_cancelacion !== undefined) updateData.motivo_cancelacion = motivo_cancelacion;

      const { data, error } = await this.supabaseService.client
        .from('citas')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new BadRequestException(error.message);
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
