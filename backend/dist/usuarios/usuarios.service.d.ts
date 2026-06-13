import { SupabaseService } from '../supabase/supabase.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
export declare class UsuariosService {
    private readonly supabaseService;
    private readonly auditoriaService;
    constructor(supabaseService: SupabaseService, auditoriaService: AuditoriaService);
    private audit;
    findAll(): Promise<{
        id: any;
        nombre_completo: any;
        correo: any;
        rol: any;
        estado: any;
        telefono: any;
        creado_en: any;
        foto_url: any;
    }[]>;
    create(body: any): Promise<any>;
    update(id: string, body: any): Promise<any>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
