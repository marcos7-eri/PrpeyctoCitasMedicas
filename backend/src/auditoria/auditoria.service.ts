import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AuditoriaService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(limit?: number) {
    try {
      const parsedLimit = limit || 100;
      const { data, error } = await this.supabaseService.client
        .from('auditoria')
        .select('id, usuario_id, accion, tabla, registro_id, detalles, creado_en, perfiles(nombre_completo, correo)')
        .order('creado_en', { ascending: false })
        .limit(parsedLimit);

      if (error) throw new BadRequestException(error.message);
      return data;
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException(err.message || 'Error interno del servidor');
    }
  }

  async create(body: any) {
    try {
      const { usuario_id, accion, tabla, registro_id, detalles } = body;
      if (!accion || !tabla) {
        throw new BadRequestException('accion y tabla son requeridos');
      }

      const { data, error } = await this.supabaseService.client
        .from('auditoria')
        .insert({
          usuario_id: usuario_id || null,
          accion,
          tabla,
          registro_id: registro_id || null,
          detalles: detalles || null,
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
}
