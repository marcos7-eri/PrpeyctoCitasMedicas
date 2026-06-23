import { Controller, Get, Post, Put, Delete, Param, Query, Body } from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * PRINCIPIOS Y ARQUITECTURAS APLICADOS EN ESTA CLASE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ARQUITECTURA LAYERED — Capa de Presentación:
 *   NotificacionesController expone los endpoints HTTP del módulo de notificaciones.
 *   Delega toda la lógica (envío de push, guardado en BD) a NotificacionesService.
 *   Las capas no se saltan: Controller → Service → SupabaseService.
 *
 * ARQUITECTURA EVENT DRIVEN — Vista del consumidor:
 *   Este controller maneja las peticiones HTTP directas (REST).
 *   Pero NotificacionesService también actúa como consumidor del EventBusService,
 *   procesando eventos asíncronos de CitasService en paralelo.
 *   Ambas formas de activar el servicio coexisten sin conflicto.
 *
 * PRINCIPIO SRP (Single Responsibility Principle):
 *   NotificacionesController tiene una sola razón para cambiar: las rutas HTTP.
 *   No sabe cómo se envían push notifications ni cómo se guardan en la BD.
 *
 * PRINCIPIO DIP (Dependency Inversion Principle):
 *   Depende de INotificacionesService (abstracción), no de la clase concreta.
 *   Si se cambia la implementación de notificaciones, este controller no cambia.
 *
 * PRINCIPIO ISP (Interface Segregation Principle):
 *   Cada endpoint expone exactamente la operación que necesita su cliente.
 *   El admin usa findAll; los servicios internos usan create; el frontend usa update.
 * ─────────────────────────────────────────────────────────────────────────────
 */
@Controller('notificaciones')
export class NotificacionesController {
  // DIP: NotificacionesService es la abstracción inyectada — no una implementación concreta
  constructor(private readonly notificacionesService: NotificacionesService) {}

  // LAYERED: traduce GET /notificaciones → service.findAll() sin lógica adicional
  @Get()
  async findAll(@Query('usuario_id') usuarioId?: string) {
    return this.notificacionesService.findAll(usuarioId);
  }

  // SRP: crear notificación es la única responsabilidad de este endpoint
  @Post()
  async create(@Body() body: any) {
    return this.notificacionesService.create(body);
  }

  // SRP: actualizar (marcar como leída) está separado de crear y eliminar
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.notificacionesService.update(id, body);
  }

  // OCP: eliminar es una acción independiente — no modifica los otros endpoints
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.notificacionesService.remove(id);
  }
}
