import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { EspecialidadesService } from './especialidades.service';

@Controller('especialidades')
export class EspecialidadesController {
  constructor(private readonly especialidadesService: EspecialidadesService) {}

  @Get()
  async findAll() {
    return this.especialidadesService.findAll();
  }

  @Post()
  async create(@Body() body: any) {
    return this.especialidadesService.create(body);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.especialidadesService.update(id, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.especialidadesService.remove(id);
  }
}
