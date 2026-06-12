import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class EspecialidadesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll() {
    try {
      const { data, error } = await this.supabaseService.client
        .from('especialidades')
        .select('id, nombre, descripcion')
        .order('nombre', { ascending: true });

      if (error) throw new BadRequestException(error.message);
      return data;
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException(err.message || 'Error interno del servidor');
    }
  }

  async create(body: any) {
    try {
      const { nombre, descripcion } = body;
      if (!nombre?.trim()) {
        throw new BadRequestException('Nombre es requerido');
      }

      const { data, error } = await this.supabaseService.client
        .from('especialidades')
        .insert({
          nombre: nombre.trim(),
          descripcion: descripcion?.trim() || null,
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
      const { nombre, descripcion } = body;
      if (!nombre?.trim()) {
        throw new BadRequestException('Nombre es requerido');
      }

      const { data, error } = await this.supabaseService.client
        .from('especialidades')
        .update({
          nombre: nombre.trim(),
          descripcion: descripcion?.trim() || null,
        })
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
      const { error } = await this.supabaseService.client.from('especialidades').delete().eq('id', id);
      if (error) throw new BadRequestException(error.message);
      return { success: true };
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException(err.message || 'Error interno del servidor');
    }
  }
}
