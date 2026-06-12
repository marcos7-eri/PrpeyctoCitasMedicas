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
exports.PacientesService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let PacientesService = class PacientesService {
    supabaseService;
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    async findAll() {
        try {
            const { data, error } = await this.supabaseService.client
                .from('pacientes')
                .select('id, perfil_id, fecha_nacimiento, genero, tipo_sangre, direccion, contacto_emergencia_nombre, contacto_emergencia_telefono, perfiles(nombre_completo, correo, telefono, estado)')
                .order('id', { ascending: false });
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
            const { perfil_id, fecha_nacimiento, genero, tipo_sangre, direccion, contacto_emergencia_nombre, contacto_emergencia_telefono } = body;
            if (!perfil_id) {
                throw new common_1.BadRequestException('perfil_id es requerido');
            }
            const { data, error } = await this.supabaseService.client
                .from('pacientes')
                .insert({
                perfil_id,
                fecha_nacimiento,
                genero,
                tipo_sangre,
                direccion,
                contacto_emergencia_nombre,
                contacto_emergencia_telefono,
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
            const { fecha_nacimiento, genero, tipo_sangre, direccion, contacto_emergencia_nombre, contacto_emergencia_telefono } = body;
            const updateData = {};
            if (fecha_nacimiento !== undefined)
                updateData.fecha_nacimiento = fecha_nacimiento;
            if (genero !== undefined)
                updateData.genero = genero;
            if (tipo_sangre !== undefined)
                updateData.tipo_sangre = tipo_sangre;
            if (direccion !== undefined)
                updateData.direccion = direccion;
            if (contacto_emergencia_nombre !== undefined)
                updateData.contacto_emergencia_nombre = contacto_emergencia_nombre;
            if (contacto_emergencia_telefono !== undefined)
                updateData.contacto_emergencia_telefono = contacto_emergencia_telefono;
            const { data, error } = await this.supabaseService.client
                .from('pacientes')
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
};
exports.PacientesService = PacientesService;
exports.PacientesService = PacientesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], PacientesService);
//# sourceMappingURL=pacientes.service.js.map