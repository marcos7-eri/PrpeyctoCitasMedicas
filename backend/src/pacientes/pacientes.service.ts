import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class PacientesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll() {
    try {
      const { data, error } = await this.supabaseService.client
        .from('pacientes')
        .select('id, perfil_id, fecha_nacimiento, genero, tipo_sangre, direccion, contacto_emergencia_nombre, contacto_emergencia_telefono, perfiles(nombre_completo, correo, telefono, estado)')
        .order('id', { ascending: false });

      if (error) throw new BadRequestException(error.message);
      return data;
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException(err.message || 'Error interno del servidor');
    }
  }

  async create(body: any) {
    try {
      const { perfil_id, fecha_nacimiento, genero, tipo_sangre, direccion, contacto_emergencia_nombre, contacto_emergencia_telefono } = body;
      if (!perfil_id) {
        throw new BadRequestException('perfil_id es requerido');
      }

      const { data, error } = await this.supabaseService.client
        .from('pacientes')
        .insert({
          perfil_id,
          fecha_nacimiento,
          genero,
          tipo_sangre,
          direccion,
          contacto_emergencia_nombre,
          contacto_emergencia_telefono,
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
      const { fecha_nacimiento, genero, tipo_sangre, direccion, contacto_emergencia_nombre, contacto_emergencia_telefono } = body;
      const updateData: Record<string, any> = {};
      if (fecha_nacimiento !== undefined) updateData.fecha_nacimiento = fecha_nacimiento;
      if (genero !== undefined) updateData.genero = genero;
      if (tipo_sangre !== undefined) updateData.tipo_sangre = tipo_sangre;
      if (direccion !== undefined) updateData.direccion = direccion;
      if (contacto_emergencia_nombre !== undefined) updateData.contacto_emergencia_nombre = contacto_emergencia_nombre;
      if (contacto_emergencia_telefono !== undefined) updateData.contacto_emergencia_telefono = contacto_emergencia_telefono;

      const { data, error } = await this.supabaseService.client
        .from('pacientes')
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
}
