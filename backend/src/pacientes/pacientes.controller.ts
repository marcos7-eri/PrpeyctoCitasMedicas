import { Controller, Get, Post, Put, Param, Body } from '@nestjs/common';
import { PacientesService } from './pacientes.service';

@Controller('pacientes')
export class PacientesController {
  constructor(private readonly pacientesService: PacientesService) {}

  @Get()
  async findAll() {
    return this.pacientesService.findAll();
  }

  @Post()
  async create(@Body() body: any) {
    return this.pacientesService.create(body);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.pacientesService.update(id, body);
  }
}
