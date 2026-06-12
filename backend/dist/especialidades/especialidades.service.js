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
exports.EspecialidadesService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let EspecialidadesService = class EspecialidadesService {
    supabaseService;
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    async findAll() {
        try {
            const { data, error } = await this.supabaseService.client
                .from('especialidades')
                .select('id, nombre, descripcion')
                .order('nombre', { ascending: true });
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
            const { nombre, descripcion } = body;
            if (!nombre?.trim()) {
                throw new common_1.BadRequestException('Nombre es requerido');
            }
            const { data, error } = await this.supabaseService.client
                .from('especialidades')
                .insert({
                nombre: nombre.trim(),
                descripcion: descripcion?.trim() || null,
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
            const { nombre, descripcion } = body;
            if (!nombre?.trim()) {
                throw new common_1.BadRequestException('Nombre es requerido');
            }
            const { data, error } = await this.supabaseService.client
                .from('especialidades')
                .update({
                nombre: nombre.trim(),
                descripcion: descripcion?.trim() || null,
            })
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
            const { error } = await this.supabaseService.client.from('especialidades').delete().eq('id', id);
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
exports.EspecialidadesService = EspecialidadesService;
exports.EspecialidadesService = EspecialidadesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], EspecialidadesService);
//# sourceMappingURL=especialidades.service.js.map