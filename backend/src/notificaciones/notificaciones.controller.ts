import { Controller, Get, Post, Put, Delete, Param, Query, Body } from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service';

@Controller('notificaciones')
export class NotificacionesController {
  constructor(private readonly notificacionesService: NotificacionesService) {}

  @Get()
  async findAll(@Query('usuario_id') usuarioId?: string) {
    return this.notificacionesService.findAll(usuarioId);
  }

  @Post()
  async create(@Body() body: any) {
    return this.notificacionesService.create(body);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.notificacionesService.update(id, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.notificacionesService.remove(id);
  }
}
