import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class HorariosService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(doctorId?: string, diaSemana?: string, activo?: string) {
    try {
      let query = this.supabaseService.client
        .from('horarios')
        .select('id, doctor_id, dia_semana, hora_inicio, hora_fin, duracion_cita, activo, creado_en, doctores(perfiles(nombre_completo), especialidades(nombre))')
        .order('dia_semana', { ascending: true });

      if (doctorId) {
        query = query.eq('doctor_id', doctorId);
      }
      if (diaSemana) {
        query = query.eq('dia_semana', diaSemana);
      }
      if (activo !== undefined) {
        query = query.eq('activo', activo === 'true');
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
      const { doctor_id, dia_semana, hora_inicio, hora_fin, duracion_cita, activo } = body;
      if (!doctor_id || dia_semana === undefined || !hora_inicio || !hora_fin) {
        throw new BadRequestException('doctor_id, dia_semana, hora_inicio y hora_fin son requeridos');
      }

      const { data, error } = await this.supabaseService.client
        .from('horarios')
        .insert({
          doctor_id,
          dia_semana,
          hora_inicio,
          hora_fin,
          duracion_cita: duracion_cita || 30,
          activo: activo !== undefined ? activo : true,
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
      const { dia_semana, hora_inicio, hora_fin, duracion_cita, activo } = body;
      const updateData: Record<string, any> = {};
      if (dia_semana !== undefined) updateData.dia_semana = dia_semana;
      if (hora_inicio !== undefined) updateData.hora_inicio = hora_inicio;
      if (hora_fin !== undefined) updateData.hora_fin = hora_fin;
      if (duracion_cita !== undefined) updateData.duracion_cita = duracion_cita;
      if (activo !== undefined) updateData.activo = activo;

      const { data, error } = await this.supabaseService.client
        .from('horarios')
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
      const { error } = await this.supabaseService.client.from('horarios').delete().eq('id', id);
      if (error) throw new BadRequestException(error.message);
      return { success: true };
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException(err.message || 'Error interno del servidor');
    }
  }
}
