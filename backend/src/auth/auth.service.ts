import { Injectable, UnauthorizedException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * PRINCIPIOS Y ARQUITECTURAS APLICADOS EN ESTA CLASE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ARQUITECTURA LAYERED — Capa de Lógica de Negocio (Autenticación):
 *   AuthService pertenece a la capa de lógica de negocio.
 *   Recibe credenciales del AuthController (capa superior) y
 *   delega la autenticación a Supabase a través de SupabaseService (capa inferior).
 *   Las capas no se saltan: Controller → AuthService → SupabaseService.
 *
 * ARQUITECTURA CLIENT-SERVER:
 *   La autenticación sigue el modelo cliente-servidor estricto:
 *   el cliente envía credenciales, el servidor valida y retorna un token de sesión.
 *   El servidor nunca almacena sesiones localmente (stateless).
 *
 * PRINCIPIO SRP (Single Responsibility Principle):
 *   AuthService tiene UNA razón para cambiar: la lógica de autenticación.
 *   El acceso a la BD está en SupabaseService. Las rutas HTTP están en AuthController.
 *   Aquí solo vive la lógica de login/logout y la obtención del perfil de usuario.
 *
 * PRINCIPIO DIP (Dependency Inversion Principle):
 *   AuthService depende de SupabaseService (abstracción de datos), no de
 *   `createClient` de Supabase directamente. Si se migra el proveedor de auth,
 *   solo cambia SupabaseService — AuthService no se modifica.
 *
 * PRINCIPIO YAGNI (You Aren't Gonna Need It):
 *   No se implementa JWT propio, refresh token manual ni 2FA porque no están
 *   en los requerimientos actuales — Supabase los gestiona internamente.
 * ─────────────────────────────────────────────────────────────────────────────
 */
@Injectable()
export class AuthService {
  // DIP: SupabaseService inyectado — AuthService no crea el cliente de BD directamente
  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * SRP: login tiene una sola responsabilidad — autenticar al usuario y retornar su perfil.
   * Pasos: validar credenciales → obtener sesión → obtener perfil del usuario.
   */
  async login(correo: string, password: string) {
    try {
      // LAYERED: delega la autenticación a Supabase Auth (capa de datos)
      const { data, error } = await this.supabaseService.client.auth.signInWithPassword({
        email: correo,
        password,
      });

      if (error) {
        throw new UnauthorizedException(error.message);
      }

      // SRP: una vez autenticado, obtiene el perfil con rol y estado del usuario
      const { data: perfil, error: perfilError } = await this.supabaseService.client
        .from('perfiles')
        .select('id, nombre_completo, correo, rol, estado')
        .eq('id', data.user.id)
        .single();

      return { user: data.user, session: data.session, perfil: perfilError ? null : perfil };
    } catch (err: any) {
      if (err instanceof UnauthorizedException) throw err;
      throw new InternalServerErrorException(err.message || 'Error interno del servidor');
    }
  }

  /**
   * SRP: logout tiene una sola responsabilidad — cerrar la sesión activa en Supabase.
   * No limpia tokens del cliente — eso es responsabilidad del frontend.
   */
  async logout() {
    try {
      const { error } = await this.supabaseService.client.auth.signOut();
      if (error) throw new BadRequestException(error.message);
      return { success: true };
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException(err.message || 'Error interno del servidor');
    }
  }
}
