import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(body: any): Promise<{
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
