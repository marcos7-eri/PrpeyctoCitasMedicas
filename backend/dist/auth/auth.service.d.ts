import { SupabaseService } from '../supabase/supabase.service';
export declare class AuthService {
    private readonly supabaseService;
    constructor(supabaseService: SupabaseService);
    login(correo: string, password: string): Promise<{
        user: import("@supabase/auth-js").User;
        session: import("@supabase/auth-js").Session;
        perfil: {
            id: any;
            nombre_completo: any;
            correo: any;
            rol: any;
            estado: any;
        } | null;
    }>;
    logout(): Promise<{
        success: boolean;
    }>;
}
