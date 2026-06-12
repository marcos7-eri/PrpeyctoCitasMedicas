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
exports.UsuariosService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let UsuariosService = class UsuariosService {
    supabaseService;
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    async findAll() {
        try {
            const { data, error } = await this.supabaseService.client
                .from('perfiles')
                .select('id, nombre_completo, correo, rol, estado, telefono, creado_en, foto_url')
                .order('creado_en', { ascending: false });
            if (error)
                throw new common_1.BadRequestException(error.message);
            return data;
        }
        catch (err) {
            if (err instanceof common_1.BadRequestException)
                throw err;
            throw new common_1.InternalServerErrorException(err.message || 'Error interno del servidor');
        }
    }
    async create(body) {
        try {
            const { nombre, correo, password, rol, telefono } = body;
            if (!nombre?.trim() || !correo?.trim() || !password || !rol) {
                throw new common_1.BadRequestException('nombre, correo, password y rol son requeridos');
            }
            const { data: authData, error: authError } = await this.supabaseService.client.auth.admin.createUser({
                email: correo.trim(),
                password,
                email_confirm: true,
                user_metadata: { nombre_completo: nombre.trim(), rol },
            });
            if (authError)
                throw new common_1.BadRequestException(authError.message);
            const perfilId = authData.user.id;
            const { data, error } = await this.supabaseService.client
                .from('perfiles')
                .upsert({
                id: perfilId,
                nombre_completo: nombre.trim(),
                correo: correo.trim(),
                rol,
                telefono: telefono?.trim() || null,
                estado: 'activo',
            })
                .select()
                .single();
            if (error)
                throw new common_1.BadRequestException(error.message);
            return data;
        }
        catch (err) {
            if (err instanceof common_1.BadRequestException)
                throw err;
            throw new common_1.InternalServerErrorException(err.message || 'Error interno del servidor');
        }
    }
    async update(id, body) {
        try {
            const { nombre_completo, correo, telefono, rol, estado } = body;
            const updateData = {};
            if (nombre_completo !== undefined)
                updateData.nombre_completo = nombre_completo;
            if (correo !== undefined)
                updateData.correo = correo;
            if (telefono !== undefined)
                updateData.telefono = telefono;
            if (rol !== undefined)
                updateData.rol = rol;
            if (estado !== undefined)
                updateData.estado = estado;
            const { data, error } = await this.supabaseService.client
                .from('perfiles')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();
            if (error)
                throw new common_1.BadRequestException(error.message);
            return data;
        }
        catch (err) {
            if (err instanceof common_1.BadRequestException)
                throw err;
            throw new common_1.InternalServerErrorException(err.message || 'Error interno del servidor');
        }
    }
    async remove(id) {
        try {
            const { error: authError } = await this.supabaseService.client.auth.admin.deleteUser(id);
            if (authError)
                throw new common_1.BadRequestException(authError.message);
            return { success: true };
        }
        catch (err) {
            if (err instanceof common_1.BadRequestException)
                throw err;
            throw new common_1.InternalServerErrorException(err.message || 'Error interno del servidor');
        }
    }
};
exports.UsuariosService = UsuariosService;
exports.UsuariosService = UsuariosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], UsuariosService);
//# sourceMappingURL=usuarios.service.js.map