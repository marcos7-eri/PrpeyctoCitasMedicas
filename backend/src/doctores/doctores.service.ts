import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AuditoriaService } from '../auditoria/auditoria.service';

@Injectable()
export class DoctoresService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  private audit(accion: string, tabla: string, registro_id: string, detalles: any) {
    this.auditoriaService.create({ accion, tabla, registro_id, detalles }).catch(() => {});
  }

  async findAll(perfilId?: string) {
    try {
      let query = this.supabaseService.client
        .from('doctores')
        .select('id, perfil_id, especialidad_id, numero_licencia, anios_experiencia, costo_consulta, biografia, perfiles(nombre_completo, correo, telefono), especialidades(nombre)')
        .order('id', { ascending: false });
      if (perfilId) query = query.eq('perfil_id', perfilId);
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
      const { nombre, correo, password, especialidad_id, numero_licencia, anios_experiencia, costo_consulta, biografia, telefono } = body;
      if (!nombre?.trim() || !correo?.trim() || !password || !especialidad_id) {
        throw new BadRequestException('nombre, correo, password y especialidad_id son requeridos');
      }

      const { data: authData, error: authError } = await this.supabaseService.client.auth.admin.createUser({
        email: correo.trim(), password, email_confirm: true,
        user_metadata: { nombre_completo: nombre.trim(), rol: 'doctor' },
      });
      if (authError) throw new BadRequestException(authError.message);

      const perfilId = authData.user.id;
      const { error: perfilError } = await this.supabaseService.client.from('perfiles').upsert({
        id: perfilId, nombre_completo: nombre.trim(), correo: correo.trim(),
        rol: 'doctor', telefono: telefono?.trim() || null, estado: 'activo',
      });
      if (perfilError) throw new BadRequestException(perfilError.message);

      const { data, error } = await this.supabaseService.client
        .from('doctores')
        .insert({ perfil_id: perfilId, especialidad_id, numero_licencia: numero_licencia || null, anios_experiencia: anios_experiencia || null, costo_consulta: costo_consulta || null, biografia: biografia?.trim() || null })
        .select().single();
      if (error) throw new BadRequestException(error.message);

      this.audit('insert', 'doctores', String(data.id), { nombre: nombre.trim(), correo: correo.trim(), especialidad_id });
      return data;
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException(err.message || 'Error interno del servidor');
    }
  }

  async update(id: string, body: any) {
    try {
      const { especialidad_id, numero_licencia, anios_experiencia, costo_consulta, biografia } = body;
      const updateData: Record<string, any> = {};
      if (especialidad_id !== undefined) updateData.especialidad_id = especialidad_id;
      if (numero_licencia !== undefined) updateData.numero_licencia = numero_licencia;
      if (anios_experiencia !== undefined) updateData.anios_experiencia = anios_experiencia;
      if (costo_consulta !== undefined) updateData.costo_consulta = costo_consulta;
      if (biografia !== undefined) updateData.biografia = biografia;

      const { data, error } = await this.supabaseService.client
        .from('doctores').update(updateData).eq('id', id).select().single();
      if (error) throw new BadRequestException(error.message);

      this.audit('update', 'doctores', id, updateData);
      return data;
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException(err.message || 'Error interno del servidor');
    }
  }

  async remove(id: string) {
    try {
      const { error } = await this.supabaseService.client.from('doctores').delete().eq('id', id);
      if (error) throw new BadRequestException(error.message);

      this.audit('delete', 'doctores', id, { eliminado: true });
      return { success: true };
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException(err.message || 'Error interno del servidor');
    }
  }
}
