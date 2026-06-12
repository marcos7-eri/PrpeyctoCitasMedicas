import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { AuditoriaService } from './auditoria.service';

@Controller('auditoria')
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  @Get()
  async findAll(@Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    return this.auditoriaService.findAll(parsedLimit);
  }

  @Post()
  async create(@Body() body: any) {
    return this.auditoriaService.create(body);
  }
}
