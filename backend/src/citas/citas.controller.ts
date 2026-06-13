import { Controller, Get, Post, Put, Patch, Delete, Param, Query, Body } from '@nestjs/common';
import { CitasService } from './citas.service';

@Controller('citas')
export class CitasController {
  constructor(private readonly citasService: CitasService) {}

  @Get()
  async findAll(@Query('doctor_id') doctorId?: string, @Query('paciente_id') pacienteId?: string) {
    return this.citasService.findAll(doctorId, pacienteId);
  }

  @Post()
  async create(@Body() body: any) {
    return this.citasService.create(body);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.citasService.update(id, body);
  }

  @Patch(':id/cancelar')
  async cancelar(@Param('id') id: string, @Body() body: any) {
    return this.citasService.cancelar(id, body?.motivo_cancelacion);
  }

  @Patch(':id/reagendar')
  async reagendar(@Param('id') id: string, @Body() body: any) {
    return this.citasService.reagendar(
      id,
      body.nueva_fecha,
      body.nueva_hora_inicio,
      body.duracion_cita ?? 30,
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.citasService.remove(id);
  }
}
