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
const notificaciones_service_1 = require("../notificaciones/notificaciones.service");
const auditoria_service_1 = require("../auditoria/auditoria.service");
const event_bus_service_1 = require("../events/event-bus.service");
const db_error_handler_1 = require("../common/db-error-handler");
const cita_events_1 = require("../events/cita.events");
let CitasService = class CitasService {
    supabaseService;
    notificacionesService;
    auditoriaService;
    eventBus;
    constructor(supabaseService, notificacionesService, auditoriaService, eventBus) {
        this.supabaseService = supabaseService;
        this.notificacionesService = notificacionesService;
        this.auditoriaService = auditoriaService;
        this.eventBus = eventBus;
    }
    audit(accion, registro_id, detalles) {
        this.auditoriaService
            .create({ accion, tabla: 'citas', registro_id, detalles })
            .catch(() => { });
    }
    async findAll(doctorId, pacienteId) {
        return (0, db_error_handler_1.handleDbOperation)(async () => {
            let query = this.supabaseService.client
                .from('citas')
                .select('id, doctor_id, paciente_id, fecha, hora_inicio, hora_fin, estado, motivo, notas, ' +
                'motivo_cancelacion, creado_por, creado_en, ' +
                'doctores(perfiles(nombre_completo), especialidades(nombre)), ' +
                'pacientes(perfiles(nombre_completo, correo))')
                .order('fecha', { ascending: false });
            if (doctorId)
                query = query.eq('doctor_id', doctorId);
            if (pacienteId)
                query = query.eq('paciente_id', pacienteId);
            const { data, error } = await query;
            if (error)
                throw new common_1.BadRequestException(error.message);
            return data ?? [];
        });
    }
    async create(body) {
        return (0, db_error_handler_1.handleDbOperation)(async () => {
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
            this.audit('insert', String(data.id), { doctor_id, paciente_id, fecha, hora_inicio, estado: 'pendiente' });
            this.eventBus.emit(new cita_events_1.CitaCreadaEvent(String(data.id), doctor_id, paciente_id, fecha));
            return data;
        });
    }
    async update(id, body) {
        return (0, db_error_handler_1.handleDbOperation)(async () => {
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
                .from('citas').update(updateData).eq('id', id).select().single();
            if (error)
                throw new common_1.BadRequestException(error.message);
            this.audit('update', id, updateData);
            return data;
        });
    }
    async confirmar(id) {
        return (0, db_error_handler_1.handleDbOperation)(async () => {
            const { data: cita, error: errCita } = await this.supabaseService.client
                .from('citas')
                .select('id, fecha, hora_inicio, estado, pacientes(perfil_id, perfiles(nombre_completo)), doctores(perfiles(nombre_completo))')
                .eq('id', id)
                .single();
            if (errCita || !cita)
                throw new common_1.BadRequestException(`Cita no encontrada (id=${id})`);
            if (cita.estado !== 'pendiente') {
                throw new common_1.BadRequestException(`La cita tiene estado "${cita.estado}", solo se pueden confirmar citas pendientes`);
            }
            const { data, error } = await this.supabaseService.client
                .from('citas').update({ estado: 'confirmada' }).eq('id', id).select().single();
            if (error)
                throw new common_1.BadRequestException(error.message);
            this.audit('update', id, { estado: 'confirmada' });
            const pacUserId = cita.pacientes?.perfil_id;
            const docNombre = cita.doctores?.perfiles?.nombre_completo ?? 'Tu doctor';
            const hora = String(cita.hora_inicio ?? '').substring(0, 5);
            const fecha = cita.fecha;
            if (pacUserId) {
                this.notificacionesService.create({
                    usuario_id: pacUserId,
                    titulo: 'Cita confirmada',
                    mensaje: `${docNombre} confirmó tu cita del ${fecha} a las ${hora}.`,
                    tipo: 'confirmacion',
                }).catch(() => { });
                this.eventBus.emit(new cita_events_1.CitaConfirmadaEvent(id, pacUserId, docNombre, fecha, hora));
            }
            return data;
        });
    }
    async completar(id) {
        return (0, db_error_handler_1.handleDbOperation)(async () => {
            const { data: cita, error: errCita } = await this.supabaseService.client
                .from('citas')
                .select('id, fecha, hora_inicio, estado, pacientes(perfil_id, perfiles(nombre_completo)), doctores(perfiles(nombre_completo))')
                .eq('id', id)
                .single();
            if (errCita || !cita)
                throw new common_1.BadRequestException('Cita no encontrada');
            if (!['pendiente', 'confirmada'].includes(cita.estado)) {
                throw new common_1.BadRequestException('Solo se pueden completar citas pendientes o confirmadas');
            }
            const { data, error } = await this.supabaseService.client
                .from('citas').update({ estado: 'completada' }).eq('id', id).select().single();
            if (error)
                throw new common_1.BadRequestException(error.message);
            this.audit('update', id, { estado: 'completada' });
            const pacUserId = cita.pacientes?.perfil_id;
            const docNombre = cita.doctores?.perfiles?.nombre_completo ?? 'Tu doctor';
            const hora = String(cita.hora_inicio ?? '').substring(0, 5);
            const fecha = cita.fecha;
            if (pacUserId) {
                this.notificacionesService.create({
                    usuario_id: pacUserId,
                    titulo: 'Cita completada',
                    mensaje: `Tu cita con ${docNombre} del ${fecha} a las ${hora} fue marcada como completada.`,
                    tipo: 'confirmacion',
                }).catch(() => { });
                this.eventBus.emit(new cita_events_1.CitaCompletadaEvent(id, pacUserId, docNombre, fecha, hora));
            }
            return data;
        });
    }
    async cancelar(id, motivo) {
        return (0, db_error_handler_1.handleDbOperation)(async () => {
            const { data: cita, error: errCita } = await this.supabaseService.client
                .from('citas')
                .select(`
          id, doctor_id, fecha, hora_inicio, estado,
          pacientes(perfil_id, perfiles(nombre_completo)),
          doctores(perfil_id, perfiles(nombre_completo))
        `)
                .eq('id', id)
                .single();
            if (errCita || !cita)
                throw new common_1.BadRequestException('Cita no encontrada');
            if (!['pendiente', 'confirmada'].includes(cita.estado)) {
                throw new common_1.BadRequestException('Solo se pueden cancelar citas pendientes o confirmadas');
            }
            const { data, error } = await this.supabaseService.client
                .from('citas')
                .update({ estado: 'cancelada', motivo_cancelacion: motivo || null })
                .eq('id', id)
                .select()
                .single();
            if (error)
                throw new common_1.BadRequestException(error.message);
            this.audit('update', id, { estado: 'cancelada', motivo_cancelacion: motivo || null });
            const doctorUserId = cita.doctores?.perfil_id;
            const pacNombre = cita.pacientes?.perfiles?.nombre_completo ?? 'Un paciente';
            const hora = String(cita.hora_inicio ?? '').substring(0, 5);
            const fecha = cita.fecha;
            if (doctorUserId) {
                this.notificacionesService.create({
                    usuario_id: doctorUserId,
                    titulo: 'Cita cancelada por el paciente',
                    mensaje: `${pacNombre} canceló su cita del ${fecha} a las ${hora}.${motivo ? ` Motivo: ${motivo}` : ''}`,
                    tipo: 'cancelacion',
                }).catch(e => console.error('[Citas] Error notif. doctor cancelar:', e?.message));
                this.eventBus.emit(new cita_events_1.CitaCanceladaEvent(id, doctorUserId, pacNombre, fecha, hora, motivo));
            }
            return data;
        });
    }
    async reagendar(id, nueva_fecha, nueva_hora_inicio, duracion_cita) {
        return (0, db_error_handler_1.handleDbOperation)(async () => {
            if (!nueva_fecha || !nueva_hora_inicio) {
                throw new common_1.BadRequestException('nueva_fecha y nueva_hora_inicio son requeridos');
            }
            const { data: cita, error: errCita } = await this.supabaseService.client
                .from('citas')
                .select(`
          id, doctor_id, fecha, hora_inicio, estado,
          pacientes(perfil_id, perfiles(nombre_completo)),
          doctores(perfil_id, perfiles(nombre_completo))
        `)
                .eq('id', id)
                .single();
            if (errCita || !cita)
                throw new common_1.BadRequestException('Cita no encontrada');
            if (!['pendiente', 'confirmada'].includes(cita.estado)) {
                throw new common_1.BadRequestException('Solo se pueden reagendar citas pendientes o confirmadas');
            }
            const { data: ocupadas } = await this.supabaseService.client
                .from('citas')
                .select('hora_inicio')
                .eq('doctor_id', cita.doctor_id)
                .eq('fecha', nueva_fecha)
                .in('estado', ['pendiente', 'confirmada'])
                .neq('id', id);
            const slotOcupado = (ocupadas ?? []).some(c => String(c.hora_inicio).substring(0, 5) === nueva_hora_inicio);
            if (slotOcupado)
                throw new common_1.BadRequestException('El horario seleccionado ya está ocupado. Elige otro.');
            const dur = duracion_cita || 30;
            const [h, m] = nueva_hora_inicio.split(':').map(Number);
            const finMin = h * 60 + m + dur;
            const hora_fin = `${String(Math.floor(finMin / 60)).padStart(2, '0')}:${String(finMin % 60).padStart(2, '0')}:00`;
            const { data, error } = await this.supabaseService.client
                .from('citas')
                .update({
                fecha: nueva_fecha,
                hora_inicio: nueva_hora_inicio + ':00',
                hora_fin,
                estado: 'pendiente',
            })
                .eq('id', id)
                .select()
                .single();
            if (error)
                throw new common_1.BadRequestException(error.message);
            this.audit('update', id, { accion: 'reagendar', nueva_fecha, nueva_hora_inicio, estado: 'pendiente' });
            const doctorUserId = cita.doctores?.perfil_id;
            const pacNombre = cita.pacientes?.perfiles?.nombre_completo ?? 'Un paciente';
            if (doctorUserId) {
                this.notificacionesService.create({
                    usuario_id: doctorUserId,
                    titulo: 'Cita reagendada por el paciente',
                    mensaje: `${pacNombre} reagendó su cita para el ${nueva_fecha} a las ${nueva_hora_inicio}.`,
                    tipo: 'confirmacion',
                }).catch(e => console.error('[Citas] Error notif. doctor reagendar:', e?.message));
                this.eventBus.emit(new cita_events_1.CitaReagendadaEvent(id, doctorUserId, pacNombre, nueva_fecha, nueva_hora_inicio));
            }
            return data;
        });
    }
    async remove(id) {
        return (0, db_error_handler_1.handleDbOperation)(async () => {
            const { error } = await this.supabaseService.client
                .from('citas').delete().eq('id', id);
            if (error)
                throw new common_1.BadRequestException(error.message);
            return { success: true };
        });
    }
};
exports.CitasService = CitasService;
exports.CitasService = CitasService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        notificaciones_service_1.NotificacionesService,
        auditoria_service_1.AuditoriaService,
        event_bus_service_1.EventBusService])
], CitasService);
//# sourceMappingURL=citas.service.js.map