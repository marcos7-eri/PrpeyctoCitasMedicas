import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class UsuariosService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll() {
    try {
      const { data, error } = await this.supabaseService.client
        .from('perfiles')
        .select('id, nombre_completo, correo, rol, estado, telefono, creado_en, foto_url')
        .order('creado_en', { ascending: false });

      if (error) throw new BadRequestException(error.message);
      return data;
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException(err.message || 'Error interno del servidor');
    }
  }

  async create(body: any) {
    try {
      const { nombre, correo, password, rol, telefono } = body;
      if (!nombre?.trim() || !correo?.trim() || !password || !rol) {
        throw new BadRequestException('nombre, correo, password y rol son requeridos');
      }

      const { data: authData, error: authError } = await this.supabaseService.client.auth.admin.createUser({
        email: correo.trim(),
        password,
        email_confirm: true,
        user_metadata: { nombre_completo: nombre.trim(), rol },
      });

      if (authError) throw new BadRequestException(authError.message);

      const perfilId = authData.user.id;

      const { data, error } = await this.supabaseService.client
        .from('perfiles')
        .upsert({
          id: perfilId,
          nombre_completo: nombre.trim(),
          correo: correo.trim(),
          rol,
          telefono: telefono?.trim() || null,
          estado: 'activo',
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
      const { nombre_completo, correo, telefono, rol, estado } = body;
      const updateData: Record<string, any> = {};
      if (nombre_completo !== undefined) updateData.nombre_completo = nombre_completo;
      if (correo !== undefined) updateData.correo = correo;
      if (telefono !== undefined) updateData.telefono = telefono;
      if (rol !== undefined) updateData.rol = rol;
      if (estado !== undefined) updateData.estado = estado;

      const { data, error } = await this.supabaseService.client
        .from('perfiles')
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
      const { error: authError } = await this.supabaseService.client.auth.admin.deleteUser(id);
      if (authError) throw new BadRequestException(authError.message);
      return { success: true };
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException(err.message || 'Error interno del servidor');
    }
  }
}
