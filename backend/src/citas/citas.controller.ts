import { Controller, Get, Post, Put, Patch, Delete, Param, Query, Body } from '@nestjs/common';
import { CitasService } from './citas.service';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * PRINCIPIOS Y ARQUITECTURAS APLICADOS EN ESTA CLASE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ARQUITECTURA LAYERED — Capa de Presentación:
 *   CitasController es la capa más externa del sistema.
 *   Su única responsabilidad es recibir peticiones HTTP y delegar
 *   toda la lógica de negocio a CitasService (capa inferior).
 *   No contiene ninguna regla de negocio — solo traduce HTTP ↔ servicio.
 *
 * ARQUITECTURA CLIENT-SERVER:
 *   Este controller expone los endpoints REST que consumen los clientes:
 *   - Frontend Next.js (dashboard admin/doctor)
 *   - App móvil React Native (CitasMovil)
 *   El servidor nunca inicia comunicación — responde a peticiones del cliente.
 *
 * PRINCIPIO SRP (Single Responsibility Principle):
 *   CitasController tiene UNA sola razón para cambiar: modificar las rutas HTTP.
 *   Si cambia la lógica de negocio, solo cambia CitasService — no este archivo.
 *   Si cambia el protocolo (ej. REST → GraphQL), solo cambia este archivo.
 *
 * PRINCIPIO DIP (Dependency Inversion Principle):
 *   CitasController depende de CitasService a través de ICitasService (abstracción),
 *   no de la implementación concreta. NestJS inyecta la dependencia por constructor.
 *
 * PRINCIPIO ISP (Interface Segregation Principle):
 *   Cada endpoint expone únicamente la operación que le corresponde.
 *   No existe un endpoint genérico que haga "todo" — cada ruta tiene su método específico.
 * ─────────────────────────────────────────────────────────────────────────────
 */
@Controller('citas')
export class CitasController {
  // DIP: CitasService se inyecta como abstracción — el Controller no sabe
  // cómo está implementado internamente el servicio
  constructor(private readonly citasService: CitasService) {}

  // LAYERED: recibe la petición HTTP y la delega sin procesar lógica
  @Get()
  async findAll(
    @Query('doctor_id')   doctorId?: string,
    @Query('paciente_id') pacienteId?: string,
  ) {
    // ISP: parámetros opcionales y específicos — no un objeto genérico de filtros
    return this.citasService.findAll(doctorId, pacienteId);
  }

  // SRP: este método solo traduce POST /citas → citasService.create()
  @Post()
  async create(@Body() body: any) {
    return this.citasService.create(body);
  }

  // SRP: actualización genérica de campos — delegada completamente al service
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.citasService.update(id, body);
  }

  // OCP: cada acción de negocio tiene su propio endpoint sin modificar los existentes
  @Patch(':id/confirmar')
  async confirmar(@Param('id') id: string) {
    return this.citasService.confirmar(id);
  }

  @Patch(':id/completar')
  async completar(@Param('id') id: string) {
    return this.citasService.completar(id);
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

  // SRP: eliminar es una operación independiente con su propio endpoint
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.citasService.remove(id);
  }
}
