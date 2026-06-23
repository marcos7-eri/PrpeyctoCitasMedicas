import { SupabaseService } from '../supabase/supabase.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { EventBusService } from '../events/event-bus.service';
import { ICitasService } from '../interfaces/ICitasService';
export declare class CitasService implements ICitasService {
    private readonly supabaseService;
    private readonly notificacionesService;
    private readonly auditoriaService;
    private readonly eventBus;
    constructor(supabaseService: SupabaseService, notificacionesService: NotificacionesService, auditoriaService: AuditoriaService, eventBus: EventBusService);
    private audit;
    findAll(doctorId?: string, pacienteId?: string): Promise<any[]>;
    create(body: any): Promise<any>;
    update(id: string, body: any): Promise<any>;
    confirmar(id: string): Promise<any>;
    completar(id: string): Promise<any>;
    cancelar(id: string, motivo?: string): Promise<any>;
    reagendar(id: string, nueva_fecha: string, nueva_hora_inicio: string, duracion_cita: number): Promise<any>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
