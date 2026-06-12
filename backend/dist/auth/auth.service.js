"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let AuthService = class AuthService {
    supabaseService;
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    async login(correo, password) {
        try {
            const { data, error } = await this.supabaseService.client.auth.signInWithPassword({
                email: correo,
                password,
            });
            if (error) {
                throw new common_1.UnauthorizedException(error.message);
            }
            const { data: perfil, error: perfilError } = await this.supabaseService.client
                .from('perfiles')
                .select('id, nombre_completo, correo, rol, estado')
                .eq('id', data.user.id)
                .single();
            return { user: data.user, session: data.session, perfil: perfilError ? null : perfil };
        }
        catch (err) {
            if (err instanceof common_1.UnauthorizedException) {
                throw err;
            }
            throw new common_1.InternalServerErrorException(err.message || 'Error interno del servidor');
        }
    }
    async logout() {
        try {
            const { error } = await this.supabaseService.client.auth.signOut();
            if (error) {
                throw new common_1.BadRequestException(error.message);
            }
            return { success: true };
        }
        catch (err) {
            if (err instanceof common_1.BadRequestException) {
                throw err;
            }
            throw new common_1.InternalServerErrorException(err.message || 'Error interno del servidor');
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], AuthService);
//# sourceMappingURL=auth.service.js.map