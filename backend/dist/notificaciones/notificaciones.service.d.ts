import { SupabaseService } from '../supabase/supabase.service';
export declare class NotificacionesService {
    private readonly supabaseService;
    private readonly logger;
    constructor(supabaseService: SupabaseService);
    findAll(usuarioId?: string): Promise<{
        id: any;
        usuario_id: any;
        titulo: any;
        mensaje: any;
        tipo: any;
        leido: any;
        fecha_envio: any;
        perfiles: {
            nombre_completo: any;
            correo: any;
        }[];
    }[]>;
    create(body: any): Promise<any>;
    private enviarPush;
    update(id: string, body: any): Promise<any>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
