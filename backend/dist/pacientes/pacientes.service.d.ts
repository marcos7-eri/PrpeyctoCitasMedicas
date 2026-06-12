import { SupabaseService } from '../supabase/supabase.service';
export declare class PacientesService {
    private readonly supabaseService;
    constructor(supabaseService: SupabaseService);
    findAll(): Promise<{
        id: any;
        perfil_id: any;
        fecha_nacimiento: any;
        genero: any;
        tipo_sangre: any;
        direccion: any;
        contacto_emergencia_nombre: any;
        contacto_emergencia_telefono: any;
        perfiles: {
            nombre_completo: any;
            correo: any;
            telefono: any;
            estado: any;
        }[];
    }[]>;
    create(body: any): Promise<any>;
    update(id: string, body: any): Promise<any>;
}
