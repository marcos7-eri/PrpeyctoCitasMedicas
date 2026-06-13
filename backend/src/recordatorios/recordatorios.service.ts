import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SupabaseService } from '../supabase/supabase.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';

@Injectable()
export class RecordatoriosService {
  private readonly logger = new Logger(RecordatoriosService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly notificacionesService: NotificacionesService,
  ) {}

  // Cada día a las 8pm envía recordatorios de citas del día siguiente
  @Cron('0 20 * * *')
  async enviarRecordatorios() {
    this.logger.log('[Recordatorios] Iniciando cron...');

    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    const fechaManana = manana.toISOString().split('T')[0];

    const { data: citas, error } = await this.supabaseService.client
      .from('citas')
      .select(`
        id, fecha, hora_inicio,
        pacientes(perfil_id),
        doctores(perfiles(nombre_completo), especialidades(nombre))
      `)
      .eq('fecha', fechaManana)
      .in('estado', ['pendiente', 'confirmada']);

    if (error) {
      this.logger.error('[Recordatorios] Error al consultar citas:', error.message);
      return;
    }

    this.logger.log(`[Recordatorios] Citas para mañana (${fechaManana}): ${citas?.length ?? 0}`);

    for (const cita of (citas ?? [])) {
      try {
        const usuarioId = (cita as any).pacientes?.perfil_id;
        if (!usuarioId) {
          this.logger.warn('[Recordatorios] Sin perfil_id, cita id:', (cita as any).id);
          continue;
        }

        const drNombre = (cita as any).doctores?.perfiles?.nombre_completo ?? 'tu médico';
        const esp      = (cita as any).doctores?.especialidades?.nombre ?? '';
        const hora     = String((cita as any).hora_inicio ?? '').substring(0, 5);
        const fechaFmt = new Date(fechaManana + 'T00:00:00').toLocaleDateString('es-ES', {
          weekday: 'long', day: 'numeric', month: 'long',
        });

        await this.notificacionesService.create({
          usuario_id: usuarioId,
          titulo:  'Recordatorio: cita médica mañana',
          mensaje: `Tienes cita con ${drNombre}${esp ? ` (${esp})` : ''} mañana ${fechaFmt} a las ${hora}. ¡No olvides asistir!`,
          tipo:    'recordatorio',
        });

        this.logger.log(`[Recordatorios] ✓ Enviado a usuario ${usuarioId}`);
      } catch (e: any) {
        this.logger.error('[Recordatorios] Error en cita', (cita as any).id, ':', e?.message ?? e);
      }
    }

    this.logger.log('[Recordatorios] Cron completado.');
  }
}
