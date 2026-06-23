import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { IaService } from './ia.service';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * PRINCIPIOS Y ARQUITECTURAS APLICADOS EN ESTA CLASE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ARQUITECTURA LAYERED — Capa de Presentación del módulo IA:
 *   IaController es el punto de entrada HTTP del módulo de inteligencia artificial.
 *   Recibe las peticiones del cliente (app móvil) y las delega a IaService.
 *   No contiene lógica médica, de sesiones ni de IA — eso está en el Service.
 *
 * ARQUITECTURA MICROKERNEL — Punto de entrada al kernel:
 *   Las peticiones llegan a IaController → IaService (kernel) → IAIProvider (plug-in).
 *   El cliente nunca sabe qué proveedor de IA está activo (Groq, OpenAI, etc.).
 *
 * ARQUITECTURA CLIENT-SERVER:
 *   Los endpoints de este controller son consumidos por la app móvil (CitasMovil)
 *   y el frontend web. El servidor procesa la solicitud y retorna la respuesta
 *   sin que el cliente conozca la implementación interna del chat médico.
 *
 * PRINCIPIO SRP (Single Responsibility Principle):
 *   IaController tiene UNA razón para cambiar: modificar las rutas del módulo IA.
 *   No toma decisiones médicas, no accede a la BD, no interactúa con Groq.
 *
 * PRINCIPIO DIP (Dependency Inversion Principle):
 *   Depende de IaService (abstracción del kernel), no de Groq ni de GroqProvider.
 *   El cambio de proveedor de IA es invisible para este controller.
 * ─────────────────────────────────────────────────────────────────────────────
 */
@Controller('ia')
export class IaController {
  // DIP: se inyecta IaService (el kernel del Microkernel), no el plug-in directamente
  constructor(private readonly iaService: IaService) {}

  /**
   * LAYERED: recibe el mensaje del usuario y lo pasa al kernel (IaService).
   * El kernel decide qué plug-in usar — este controller no lo sabe ni le importa.
   * POST /ia/chat → IaService.chat() → GroqProvider.generarRespuesta()
   */
  @Post('chat')
  async chat(@Body() body: { mensaje: string; paciente_id: string; sesion_id?: string }) {
    return this.iaService.chat(body.paciente_id, body.sesion_id, body.mensaje);
  }

  // SRP: iniciar sesión es una operación independiente del chat
  @Post('sesion')
  async iniciarSesion(@Body() body: { paciente_id: string }) {
    return this.iaService.iniciarSesion(body.paciente_id);
  }

  // SRP: obtener mensajes es solo lectura — separado del flujo de chat
  @Get('sesion/:id/mensajes')
  async obtenerMensajes(@Param('id') id: string) {
    return this.iaService.obtenerMensajes(id);
  }

  // OCP: cerrar sesión es una acción independiente sin modificar los otros endpoints
  @Post('sesion/:id/cerrar')
  async cerrarSesion(@Param('id') id: string) {
    return this.iaService.cerrarSesion(id);
  }
}
