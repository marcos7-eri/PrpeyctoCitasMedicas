import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { IaService } from './ia.service';

@Controller('ia')
export class IaController {
  constructor(private readonly iaService: IaService) {}

  @Post('chat')
  async chat(@Body() body: { mensaje: string; paciente_id: string; sesion_id?: string }) {
    return this.iaService.chat(body.paciente_id, body.sesion_id, body.mensaje);
  }

  @Post('sesion')
  async iniciarSesion(@Body() body: { paciente_id: string }) {
    return this.iaService.iniciarSesion(body.paciente_id);
  }

  @Get('sesion/:id/mensajes')
  async obtenerMensajes(@Param('id') id: string) {
    return this.iaService.obtenerMensajes(id);
  }

  @Post('sesion/:id/cerrar')
  async cerrarSesion(@Param('id') id: string) {
    return this.iaService.cerrarSesion(id);
  }
}
