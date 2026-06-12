import { SupabaseService } from '../supabase/supabase.service';
export declare class AuditoriaService {
    private readonly supabaseService;
    constructor(supabaseService: SupabaseService);
    findAll(limit?: number): Promise<{
        id: any;
        usuario_id: any;
        accion: any;
        tabla: any;
        registro_id: any;
        detalles: any;
        creado_en: any;
        perfiles: {
            nombre_completo: any;
            correo: any;
        }[];
    }[]>;
    create(body: any): Promise<any>;
}
