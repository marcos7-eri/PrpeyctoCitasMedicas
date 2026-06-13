import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

@Injectable()
export class NotificacionesService {
  private readonly logger = new Logger(NotificacionesService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(usuarioId?: string) {
    try {
      let query = this.supabaseService.client
        .from('notificaciones')
        .select('id, usuario_id, titulo, mensaje, tipo, leido, fecha_envio')
        .order('fecha_envio', { ascending: false });

      if (usuarioId) query = query.eq('usuario_id', usuarioId);

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
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException(err.message || 'Error interno del servidor');
    }
  }

  private async enviarPush(usuarioId: string, titulo: string, cuerpo: string) {
    const { data: perfil } = await this.supabaseService.client
      .from('perfiles')
      .select('expo_push_token')
      .eq('id', usuarioId)
      .maybeSingle();

    const token = (perfil as any)?.expo_push_token;
    if (!token) return;

    this.logger.log(`[Push] Enviando push a token: ${token.substring(0, 30)}...`);

    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        to:    token,
        title: titulo,
        body:  cuerpo,
        sound: 'default',
        priority: 'high',
        data: { tipo: 'notificacion' },
      }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok || (json as any)?.data?.status === 'error') {
      this.logger.warn('[Push] Respuesta con error:', JSON.stringify(json));
    } else {
      this.logger.log('[Push] ✓ Push enviado correctamente');
    }
  }

  async update(id: string, body: any) {
    try {
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
