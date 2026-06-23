import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * PRINCIPIOS Y ARQUITECTURAS APLICADOS EN ESTA CLASE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ARQUITECTURA LAYERED — Capa de Lógica de Negocio (Auditoría):
 *   AuditoriaService pertenece a la capa de lógica de negocio.
 *   Es llamado por servicios de dominio (CitasService, PacientesService, etc.)
 *   cuando se producen cambios importantes que deben quedar registrados.
 *   Delega el acceso a la BD únicamente a SupabaseService (capa inferior).
 *
 * PRINCIPIO SRP (Single Responsibility Principle):
 *   AuditoriaService tiene UNA sola razón para cambiar: la lógica de auditoría.
 *   No gestiona citas, pacientes ni usuarios — solo registra eventos del sistema.
 *   CitasService llama a audit() sin saber cómo se implementa la auditoría.
 *
 * PRINCIPIO OCP (Open/Closed Principle):
 *   Para agregar un nuevo tipo de auditoría (ej. auditoría a nivel de archivo),
 *   se extiende este servicio o se crea uno nuevo — sin modificar AuditoriaService.
 *
 * PRINCIPIO DIP (Dependency Inversion Principle):
 *   AuditoriaService depende de SupabaseService (abstracción de datos).
 *   Los servicios que lo invocan (CitasService, etc.) dependen de la interfaz
 *   de AuditoriaService, no de la implementación concreta.
 *
 * PRINCIPIO DRY (Don't Repeat Yourself):
 *   En lugar de que cada servicio escriba directamente en la tabla 'auditoria',
 *   todos delegan a este servicio centralizado.
 *   Cambiar la estructura de auditoría solo requiere modificar este archivo.
 * ─────────────────────────────────────────────────────────────────────────────
 */
@Injectable()
export class AuditoriaService {
  // DIP: SupabaseService inyectado como abstracción de la capa de datos
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * SRP: findAll solo tiene una responsabilidad — listar los registros de auditoría.
   * La paginación por límite evita sobrecargar la consulta (YAGNI: sin paginación compleja).
   */
  async findAll(limit?: number) {
    try {
      const parsedLimit = limit || 100;

      // LAYERED: acceso a datos siempre a través de SupabaseService, nunca directo
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

  /**
   * SRP: create tiene una sola responsabilidad — registrar un evento de auditoría.
   * Es llamado de forma fire-and-forget desde los servicios de dominio:
   *   this.auditoriaService.create({...}).catch(() => {});
   * Los errores de auditoría no deben bloquear la operación principal.
   *
   * DRY: centraliza el INSERT de auditoría — ningún otro servicio lo hace directamente.
   */
  async create(body: any) {
    try {
      const { usuario_id, accion, tabla, registro_id, detalles } = body;

      // Validación mínima: accion y tabla son el mínimo identificable de un registro de auditoría
      if (!accion || !tabla) {
        throw new BadRequestException('accion y tabla son requeridos');
      }

      const { data, error } = await this.supabaseService.client
        .from('auditoria')
        .insert({
          usuario_id:  usuario_id  || null,
          accion,
          tabla,
          registro_id: registro_id || null,
          detalles:    detalles    || null,
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
