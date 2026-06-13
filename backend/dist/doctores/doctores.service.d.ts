import { SupabaseService } from '../supabase/supabase.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
export declare class DoctoresService {
    private readonly supabaseService;
    private readonly auditoriaService;
    constructor(supabaseService: SupabaseService, auditoriaService: AuditoriaService);
    private audit;
    findAll(perfilId?: string): Promise<{
        id: any;
        perfil_id: any;
        especialidad_id: any;
        numero_licencia: any;
        anios_experiencia: any;
        costo_consulta: any;
        biografia: any;
        perfiles: {
            nombre_completo: any;
            correo: any;
            telefono: any;
            estado: any;
        }[];
        especialidades: {
            nombre: any;
        }[];
    }[]>;
    create(body: any): Promise<any>;
    update(id: string, body: any): Promise<any>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
