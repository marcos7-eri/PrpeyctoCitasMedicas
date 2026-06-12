import { SupabaseService } from '../supabase/supabase.service';
export declare class EspecialidadesService {
    private readonly supabaseService;
    constructor(supabaseService: SupabaseService);
    findAll(): Promise<{
        id: any;
        nombre: any;
        descripcion: any;
    }[]>;
    create(body: any): Promise<any>;
    update(id: string, body: any): Promise<any>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
