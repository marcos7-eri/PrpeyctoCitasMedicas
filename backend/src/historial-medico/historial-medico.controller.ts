import { Controller, Get, Post, Put, Delete, Param, Query, Body } from '@nestjs/common';
import { HistorialMedicoService } from './historial-medico.service';

@Controller('historial-medico')
export class HistorialMedicoController {
  constructor(private readonly historialMedicoService: HistorialMedicoService) {}

  // --- Historial ---

  @Get()
  async findAll(
    @Query('paciente_id') pacienteId?: string,
    @Query('doctor_id') doctorId?: string,
  ) {
    return this.historialMedicoService.findAll(pacienteId, doctorId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.historialMedicoService.findOne(id);
  }

  @Post()
  async create(@Body() body: any) {
    return this.historialMedicoService.create(body);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.historialMedicoService.update(id, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.historialMedicoService.remove(id);
  }

  // --- Recetas ---

  @Get(':id/recetas')
  async findRecetas(@Param('id') id: string) {
    return this.historialMedicoService.findRecetas(id);
  }

  @Post('recetas')
  async createReceta(@Body() body: any) {
    return this.historialMedicoService.createReceta(body);
  }

  @Put('recetas/:id')
  async updateReceta(@Param('id') id: string, @Body() body: any) {
    return this.historialMedicoService.updateReceta(id, body);
  }

  @Delete('recetas/:id')
  async removeReceta(@Param('id') id: string) {
    return this.historialMedicoService.removeReceta(id);
  }
}
