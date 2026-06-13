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
var NotificacionesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificacionesService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
let NotificacionesService = NotificacionesService_1 = class NotificacionesService {
    supabaseService;
    logger = new common_1.Logger(NotificacionesService_1.name);
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    async findAll(usuarioId) {
        try {
            let query = this.supabaseService.client
                .from('notificaciones')
                .select('id, usuario_id, titulo, mensaje, tipo, leido, fecha_envio, perfiles(nombre_completo, correo)')
                .order('fecha_envio', { ascending: false });
            if (usuarioId)
                query = query.eq('usuario_id', usuarioId);
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
            const { usuario_id, titulo, mensaje, tipo } = body;
            if (!titulo?.trim() || !mensaje?.trim()) {
                throw new common_1.BadRequestException('Título y mensaje son requeridos');
            }
            const { data, error } = await this.supabaseService.client
                .from('notificaciones')
                .insert({
                usuario_id: usuario_id || null,
                titulo: titulo.trim(),
                mensaje: mensaje.trim(),
                tipo: tipo || 'info',
                leido: false,
            })
                .select()
                .single();
            if (error)
                throw new common_1.BadRequestException(error.message);
            if (usuario_id) {
                this.enviarPush(usuario_id, titulo.trim(), mensaje.trim())
                    .catch(e => this.logger.warn('[Push] Error al enviar push:', e?.message));
            }
            return data;
        }
        catch (err) {
            if (err instanceof common_1.BadRequestException)
                throw err;
            throw new common_1.InternalServerErrorException(err.message || 'Error interno del servidor');
        }
    }
    async enviarPush(usuarioId, titulo, cuerpo) {
        const { data: perfil } = await this.supabaseService.client
            .from('perfiles')
            .select('expo_push_token')
            .eq('id', usuarioId)
            .maybeSingle();
        const token = perfil?.expo_push_token;
        if (!token)
            return;
        this.logger.log(`[Push] Enviando push a token: ${token.substring(0, 30)}...`);
        const res = await fetch(EXPO_PUSH_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
                to: token,
                title: titulo,
                body: cuerpo,
                sound: 'default',
                priority: 'high',
                data: { tipo: 'notificacion' },
            }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json?.data?.status === 'error') {
            this.logger.warn('[Push] Respuesta con error:', JSON.stringify(json));
        }
        else {
            this.logger.log('[Push] ✓ Push enviado correctamente');
        }
    }
    async update(id, body) {
        try {
            const { leido, titulo, mensaje, tipo } = body;
            const updateData = {};
            if (leido !== undefined)
                updateData.leido = leido;
            if (titulo !== undefined)
                updateData.titulo = titulo;
            if (mensaje !== undefined)
                updateData.mensaje = mensaje;
            if (tipo !== undefined)
                updateData.tipo = tipo;
            const { data, error } = await this.supabaseService.client
                .from('notificaciones').update(updateData).eq('id', id).select().single();
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
            const { error } = await this.supabaseService.client.from('notificaciones').delete().eq('id', id);
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
exports.NotificacionesService = NotificacionesService;
exports.NotificacionesService = NotificacionesService = NotificacionesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], NotificacionesService);
//# sourceMappingURL=notificaciones.service.js.map