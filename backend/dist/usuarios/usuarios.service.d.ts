import { SupabaseService } from '../supabase/supabase.service';
export declare class UsuariosService {
    private readonly supabaseService;
    constructor(supabaseService: SupabaseService);
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
