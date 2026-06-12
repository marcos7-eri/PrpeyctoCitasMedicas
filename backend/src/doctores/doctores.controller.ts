import { Controller, Get, Post, Put, Delete, Param, Query, Body } from '@nestjs/common';
import { DoctoresService } from './doctores.service';

@Controller('doctores')
export class DoctoresController {
  constructor(private readonly doctoresService: DoctoresService) {}

  @Get()
  async findAll(@Query('perfil_id') perfilId?: string) {
    return this.doctoresService.findAll(perfilId);
  }

  @Post()
  async create(@Body() body: any) {
    return this.doctoresService.create(body);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.doctoresService.update(id, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.doctoresService.remove(id);
  }
}
