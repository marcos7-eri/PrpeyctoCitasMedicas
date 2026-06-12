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
exports.CitasService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let CitasService = class CitasService {
    supabaseService;
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    async findAll(doctorId, pacienteId) {
        try {
            let query = this.supabaseService.client
                .from('citas')
                .select('id, doctor_id, paciente_id, fecha, hora_inicio, hora_fin, estado, motivo, notas, motivo_cancelacion, creado_por, creado_en, doctores(perfiles(nombre_completo), especialidades(nombre)), pacientes(perfiles(nombre_completo, correo))')
                .order('fecha', { ascending: false });
            if (doctorId) {
                query = query.eq('doctor_id', doctorId);
            }
            if (pacienteId) {
                query = query.eq('paciente_id', pacienteId);
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
            const { doctor_id, paciente_id, fecha, hora_inicio, hora_fin, motivo, notas, creado_por } = body;
            if (!doctor_id || !paciente_id || !fecha || !hora_inicio) {
                throw new common_1.BadRequestException('doctor_id, paciente_id, fecha y hora_inicio son requeridos');
            }
            const { data, error } = await this.supabaseService.client
                .from('citas')
                .insert({
                doctor_id,
                paciente_id,
                fecha,
                hora_inicio,
                hora_fin: hora_fin || null,
                motivo: motivo || null,
                notas: notas || null,
                creado_por: creado_por || null,
                estado: 'pendiente',
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
            const { estado, motivo, hora_inicio, hora_fin, fecha, notas, motivo_cancelacion } = body;
            const updateData = {};
            if (estado !== undefined)
                updateData.estado = estado;
            if (motivo !== undefined)
                updateData.motivo = motivo;
            if (hora_inicio !== undefined)
                updateData.hora_inicio = hora_inicio;
            if (hora_fin !== undefined)
                updateData.hora_fin = hora_fin;
            if (fecha !== undefined)
                updateData.fecha = fecha;
            if (notas !== undefined)
                updateData.notas = notas;
            if (motivo_cancelacion !== undefined)
                updateData.motivo_cancelacion = motivo_cancelacion;
            const { data, error } = await this.supabaseService.client
                .from('citas')
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
            const { error } = await this.supabaseService.client.from('citas').delete().eq('id', id);
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
exports.CitasService = CitasService;
exports.CitasService = CitasService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], CitasService);
//# sourceMappingURL=citas.service.js.map