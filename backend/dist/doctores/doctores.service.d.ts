import { SupabaseService } from '../supabase/supabase.service';
export declare class DoctoresService {
    private readonly supabaseService;
    constructor(supabaseService: SupabaseService);
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
