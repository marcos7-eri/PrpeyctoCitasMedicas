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
exports.DoctoresService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let DoctoresService = class DoctoresService {
    supabaseService;
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    async findAll(perfilId) {
        try {
            let query = this.supabaseService.client
                .from('doctores')
                .select('id, perfil_id, especialidad_id, numero_licencia, anios_experiencia, costo_consulta, biografia, perfiles(nombre_completo, correo, telefono), especialidades(nombre)')
                .order('id', { ascending: false });
            if (perfilId) {
                query = query.eq('perfil_id', perfilId);
            }
            const { data, error } = await query;
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
            const { nombre, correo, password, especialidad_id, numero_licencia, anios_experiencia, costo_consulta, biografia, telefono } = body;
            if (!nombre?.trim() || !correo?.trim() || !password || !especialidad_id) {
                throw new common_1.BadRequestException('nombre, correo, password y especialidad_id son requeridos');
            }
            const { data: authData, error: authError } = await this.supabaseService.client.auth.admin.createUser({
                email: correo.trim(),
                password,
                email_confirm: true,
                user_metadata: { nombre_completo: nombre.trim(), rol: 'doctor' },
            });
            if (authError)
                throw new common_1.BadRequestException(authError.message);
            const perfilId = authData.user.id;
            const { error: perfilError } = await this.supabaseService.client.from('perfiles').upsert({
                id: perfilId,
                nombre_completo: nombre.trim(),
                correo: correo.trim(),
                rol: 'doctor',
                telefono: telefono?.trim() || null,
                estado: 'activo',
            });
            if (perfilError)
                throw new common_1.BadRequestException(perfilError.message);
            const { data, error } = await this.supabaseService.client
                .from('doctores')
                .insert({
                perfil_id: perfilId,
                especialidad_id,
                numero_licencia: numero_licencia || null,
                anios_experiencia: anios_experiencia || null,
                costo_consulta: costo_consulta || null,
                biografia: biografia?.trim() || null,
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
            const { especialidad_id, numero_licencia, anios_experiencia, costo_consulta, biografia } = body;
            const updateData = {};
            if (especialidad_id !== undefined)
                updateData.especialidad_id = especialidad_id;
            if (numero_licencia !== undefined)
                updateData.numero_licencia = numero_licencia;
            if (anios_experiencia !== undefined)
                updateData.anios_experiencia = anios_experiencia;
            if (costo_consulta !== undefined)
                updateData.costo_consulta = costo_consulta;
            if (biografia !== undefined)
                updateData.biografia = biografia;
            const { data, error } = await this.supabaseService.client
                .from('doctores')
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
            const { error } = await this.supabaseService.client.from('doctores').delete().eq('id', id);
            if (error)
                throw new common_1.BadRequestException(error.message);
            return { success: true };
        }
        catch (err) {
            if (err instanceof common_1.BadRequestException)
                throw err;
            throw new common_1.InternalServerErrorException(err.message || 'Error interno del servidor');
        }
    }
};
exports.DoctoresService = DoctoresService;
exports.DoctoresService = DoctoresService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], DoctoresService);
//# sourceMappingURL=doctores.service.js.map