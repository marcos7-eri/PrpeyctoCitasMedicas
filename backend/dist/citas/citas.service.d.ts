import { SupabaseService } from '../supabase/supabase.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
export declare class CitasService {
    private readonly supabaseService;
    private readonly notificacionesService;
    private readonly auditoriaService;
    constructor(supabaseService: SupabaseService, notificacionesService: NotificacionesService, auditoriaService: AuditoriaService);
    private audit;
    findAll(doctorId?: string, pacienteId?: string): Promise<{
        id: any;
        doctor_id: any;
        paciente_id: any;
        fecha: any;
        hora_inicio: any;
        hora_fin: any;
        estado: any;
        motivo: any;
        notas: any;
        motivo_cancelacion: any;
        creado_por: any;
        creado_en: any;
        doctores: {
            perfiles: {
                nombre_completo: any;
            }[];
            especialidades: {
                nombre: any;
            }[];
        }[];
        pacientes: {
            perfiles: {
                nombre_completo: any;
                correo: any;
            }[];
        }[];
    }[]>;
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
