import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class NotificacionesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(usuarioId?: string) {
    try {
      let query = this.supabaseService.client
        .from('notificaciones')
        .select('id, usuario_id, titulo, mensaje, tipo, leido, fecha_envio')
        .order('fecha_envio', { ascending: false });

      if (usuarioId) {
        query = query.eq('usuario_id', usuarioId);
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
      const { usuario_id, titulo, mensaje, tipo } = body;
      if (!titulo?.trim() || !mensaje?.trim()) {
        throw new BadRequestException('Título y mensaje son requeridos');
      }

      const { data, error } = await this.supabaseService.client
        .from('notificaciones')
        .insert({
          usuario_id: usuario_id || null,
          titulo: titulo.trim(),
          mensaje: mensaje.trim(),
          tipo: tipo || 'info',
          leido: false,
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
      const { leido, titulo, mensaje, tipo } = body;
      const updateData: Record<string, any> = {};
      if (leido !== undefined) updateData.leido = leido;
      if (titulo !== undefined) updateData.titulo = titulo;
      if (mensaje !== undefined) updateData.mensaje = mensaje;
      if (tipo !== undefined) updateData.tipo = tipo;

      const { data, error } = await this.supabaseService.client
        .from('notificaciones')
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
      const { error } = await this.supabaseService.client.from('notificaciones').delete().eq('id', id);
      if (error) throw new BadRequestException(error.message);
      return { success: true };
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException(err.message || 'Error interno del servidor');
    }
  }
}
