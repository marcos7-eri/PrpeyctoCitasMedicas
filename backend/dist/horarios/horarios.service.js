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
exports.HorariosService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let HorariosService = class HorariosService {
    supabaseService;
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    async findAll(doctorId, diaSemana, activo) {
        try {
            let query = this.supabaseService.client
                .from('horarios')
                .select('id, doctor_id, dia_semana, hora_inicio, hora_fin, duracion_cita, activo, creado_en, doctores(perfiles(nombre_completo), especialidades(nombre))')
                .order('dia_semana', { ascending: true });
            if (doctorId) {
                query = query.eq('doctor_id', doctorId);
            }
            if (diaSemana) {
                query = query.eq('dia_semana', diaSemana);
            }
            if (activo !== undefined) {
                query = query.eq('activo', activo === 'true');
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
            const { doctor_id, dia_semana, hora_inicio, hora_fin, duracion_cita, activo } = body;
            if (!doctor_id || dia_semana === undefined || !hora_inicio || !hora_fin) {
                throw new common_1.BadRequestException('doctor_id, dia_semana, hora_inicio y hora_fin son requeridos');
            }
            const { data, error } = await this.supabaseService.client
                .from('horarios')
                .insert({
                doctor_id,
                dia_semana,
                hora_inicio,
                hora_fin,
                duracion_cita: duracion_cita || 30,
                activo: activo !== undefined ? activo : true,
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
            const { dia_semana, hora_inicio, hora_fin, duracion_cita, activo } = body;
            const updateData = {};
            if (dia_semana !== undefined)
                updateData.dia_semana = dia_semana;
            if (hora_inicio !== undefined)
                updateData.hora_inicio = hora_inicio;
            if (hora_fin !== undefined)
                updateData.hora_fin = hora_fin;
            if (duracion_cita !== undefined)
                updateData.duracion_cita = duracion_cita;
            if (activo !== undefined)
                updateData.activo = activo;
            const { data, error } = await this.supabaseService.client
                .from('horarios')
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
            const { error } = await this.supabaseService.client.from('horarios').delete().eq('id', id);
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
exports.HorariosService = HorariosService;
exports.HorariosService = HorariosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], HorariosService);
//# sourceMappingURL=horarios.service.js.map