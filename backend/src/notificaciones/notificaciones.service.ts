import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { INotificacionesService } from '../interfaces/INotificacionesService';
import { EventBusService } from '../events/event-bus.service';
import { handleDbOperation } from '../common/db-error-handler';
import {
  CitaConfirmadaEvent,
  CitaCanceladaEvent,
  CitaCompletadaEvent,
  CitaReagendadaEvent,
  CitaCreadaEvent,
} from '../events/cita.events';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * PRINCIPIOS Y ARQUITECTURAS APLICADOS EN ESTA CLASE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * PRINCIPIO ISP (Interface Segregation Principle):
 *   Implementa INotificacionesService — una interfaz específica y mínima.
 *   Los módulos externos dependen de esa interfaz, no de esta clase concreta.
 *
 * PRINCIPIO SRP (Single Responsibility Principle):
 *   NotificacionesService tiene dos responsabilidades claras y cohesionadas:
 *   1. CRUD de notificaciones en la base de datos.
 *   2. Envío de push notifications a dispositivos móviles.
 *   Ambas son parte del mismo dominio "notificaciones".
 *
 * ARQUITECTURA EVENT DRIVEN — Rol de CONSUMIDOR:
 *   NotificacionesService implementa OnModuleInit para suscribirse al EventBusService.
 *   Recibe eventos de dominio (CitaConfirmada, CitaCancelada, etc.) y registra
 *   su llegada con Logger — demostrando el patrón Pub/Sub desacoplado.
 *   En producción este suscriptor podría disparar análisis, alertas o métricas
 *   sin que CitasService (el productor) sepa nada de ello (OCP).
 *
 * PRINCIPIO DRY (Don't Repeat Yourself):
 *   Usa handleDbOperation() para centralizar el manejo de errores de BD.
 * ─────────────────────────────────────────────────────────────────────────────
 */
@Injectable()
export class NotificacionesService implements INotificacionesService, OnModuleInit {
  private readonly logger = new Logger(NotificacionesService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    // DIP: depende de la abstracción EventBusService, no de RxJS Subject directamente
    private readonly eventBus: EventBusService,
  ) {}

  /**
   * EVENT DRIVEN — suscripción al bus al arrancar el módulo.
   * OnModuleInit garantiza que las suscripciones se registren antes de procesar requests.
   * Esto demuestra el patrón Pub/Sub: NotificacionesService es el CONSUMIDOR.
   */
  onModuleInit() {
    // Consumidor: reacciona a citas confirmadas
    this.eventBus.on<CitaConfirmadaEvent>('cita.confirmada').subscribe(evt => {
      this.logger.log(
        `[EventDriven] cita.confirmada → citaId=${evt.citaId} | paciente=${evt.pacienteUserId} | doctor=${evt.doctorNombre}`,
      );
    });

    // Consumidor: reacciona a citas canceladas
    this.eventBus.on<CitaCanceladaEvent>('cita.cancelada').subscribe(evt => {
      this.logger.log(
        `[EventDriven] cita.cancelada → citaId=${evt.citaId} | doctor=${evt.doctorUserId} | paciente=${evt.pacienteNombre}`,
      );
    });

    // Consumidor: reacciona a citas completadas
    this.eventBus.on<CitaCompletadaEvent>('cita.completada').subscribe(evt => {
      this.logger.log(
        `[EventDriven] cita.completada → citaId=${evt.citaId} | paciente=${evt.pacienteUserId}`,
      );
    });

    // Consumidor: reacciona a citas reagendadas
    this.eventBus.on<CitaReagendadaEvent>('cita.reagendada').subscribe(evt => {
      this.logger.log(
        `[EventDriven] cita.reagendada → citaId=${evt.citaId} | nuevaFecha=${evt.nuevaFecha} ${evt.nuevaHora}`,
      );
    });

    // Consumidor: reacciona a citas nuevas
    this.eventBus.on<CitaCreadaEvent>('cita.creada').subscribe(evt => {
      this.logger.log(
        `[EventDriven] cita.creada → citaId=${evt.citaId} | doctor=${evt.doctorId} | fecha=${evt.fecha}`,
      );
    });

    this.logger.log('[EventDriven] NotificacionesService suscrito al EventBusService ✓');
  }

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  async findAll(usuarioId?: string): Promise<any[]> {
    return handleDbOperation(async () => {
      let query = this.supabaseService.client
        .from('notificaciones')
        .select('id, usuario_id, titulo, mensaje, tipo, leido, fecha_envio, perfiles(nombre_completo, correo)')
        .order('fecha_envio', { ascending: false });

      if (usuarioId) query = query.eq('usuario_id', usuarioId);

      const { data, error } = await query;
      if (error) throw new BadRequestException(error.message);
      return data ?? [];
    });
  }

  async create(body: { usuario_id?: string; titulo: string; mensaje: string; tipo?: string }): Promise<any> {
    return handleDbOperation(async () => {
      const { usuario_id, titulo, mensaje, tipo } = body;
      if (!titulo?.trim() || !mensaje?.trim()) {
        throw new BadRequestException('Título y mensaje son requeridos');
      }

      const { data, error } = await this.supabaseService.client
        .from('notificaciones')
        .insert({
          usuario_id: usuario_id || null,
          titulo:     titulo.trim(),
          mensaje:    mensaje.trim(),
          tipo:       tipo || 'info',
          leido:      false,
        })
        .select()
        .single();

      if (error) throw new BadRequestException(error.message);

      // Enviar push notification si el usuario tiene token registrado
      if (usuario_id) {
        this.enviarPush(usuario_id, titulo.trim(), mensaje.trim())
          .catch(e => this.logger.warn('[Push] Error al enviar push:', e?.message));
      }

      return data;
    });
  }

  async update(id: string, body: any): Promise<any> {
    return handleDbOperation(async () => {
      const { leido, titulo, mensaje, tipo } = body;
      const updateData: Record<string, any> = {};
      if (leido   !== undefined) updateData.leido   = leido;
      if (titulo  !== undefined) updateData.titulo  = titulo;
      if (mensaje !== undefined) updateData.mensaje = mensaje;
      if (tipo    !== undefined) updateData.tipo    = tipo;

      const { data, error } = await this.supabaseService.client
        .from('notificaciones').update(updateData).eq('id', id).select().single();

      if (error) throw new BadRequestException(error.message);
      return data;
    });
  }

  async remove(id: string): Promise<{ success: boolean }> {
    return handleDbOperation(async () => {
      const { error } = await this.supabaseService.client
        .from('notificaciones').delete().eq('id', id);
      if (error) throw new BadRequestException(error.message);
      return { success: true };
    });
  }

  // ─── Push Notifications ───────────────────────────────────────────────────

  private async enviarPush(usuarioId: string, titulo: string, cuerpo: string): Promise<void> {
    const { data: perfil } = await this.supabaseService.client
      .from('perfiles')
      .select('expo_push_token')
      .eq('id', usuarioId)
      .maybeSingle();

    const token = (perfil as any)?.expo_push_token;
    if (!token) return;

    this.logger.log(`[Push] Enviando push a token: ${token.substring(0, 30)}...`);

    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          to:       token,
          title:    titulo,
          body:     cuerpo,
          sound:    'default',
          priority: 'high',
          data:     { tipo: 'notificacion' },
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || (json as any)?.data?.status === 'error') {
        this.logger.warn('[Push] Respuesta con error:', JSON.stringify(json));
      } else {
        this.logger.log('[Push] ✓ Push enviado correctamente');
      }
    } catch (err: any) {
      throw new InternalServerErrorException(`[Push] ${err.message}`);
    }
  }
}
