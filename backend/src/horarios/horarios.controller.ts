import { Controller, Get, Post, Put, Delete, Param, Query, Body } from '@nestjs/common';
import { HorariosService } from './horarios.service';

@Controller('horarios')
export class HorariosController {
  constructor(private readonly horariosService: HorariosService) {}

  @Get()
  async findAll(
    @Query('doctor_id') doctorId?: string,
    @Query('dia_semana') diaSemana?: string,
    @Query('activo') activo?: string,
  ) {
    return this.horariosService.findAll(doctorId, diaSemana, activo);
  }

  @Post()
  async create(@Body() body: any) {
    return this.horariosService.create(body);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.horariosService.update(id, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.horariosService.remove(id);
  }
}
