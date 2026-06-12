import { Injectable, UnauthorizedException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AuthService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async login(correo: string, password: string) {
    try {
      const { data, error } = await this.supabaseService.client.auth.signInWithPassword({
        email: correo,
        password,
      });

      if (error) {
        throw new UnauthorizedException(error.message);
      }

      const { data: perfil, error: perfilError } = await this.supabaseService.client
        .from('perfiles')
        .select('id, nombre_completo, correo, rol, estado')
        .eq('id', data.user.id)
        .single();

      return { user: data.user, session: data.session, perfil: perfilError ? null : perfil };
    } catch (err: any) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new InternalServerErrorException(err.message || 'Error interno del servidor');
    }
  }

  async logout() {
    try {
      const { error } = await this.supabaseService.client.auth.signOut();
      if (error) {
        throw new BadRequestException(error.message);
      }
      return { success: true };
    } catch (err: any) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      throw new InternalServerErrorException(err.message || 'Error interno del servidor');
    }
  }
}
