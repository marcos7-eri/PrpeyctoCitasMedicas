import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IaController } from './ia.controller';
import { IaService } from './ia.service';
import { GroqProvider } from './providers/groq.provider';
import Groq from 'groq-sdk';

/**
 * ARQUITECTURA MICROKERNEL — Registro del plug-in de IA.
 *
 * Este módulo actúa como el "gestor de plug-ins" del Microkernel:
 * - Define qué plug-in concreto se usará como proveedor de IA.
 * - Lo registra bajo el token 'AI_PROVIDER' que IaService espera.
 *
 * PRINCIPIO OCP (Open/Closed Principle):
 *   Para cambiar de proveedor (Groq → OpenAI), solo se cambia la factory
 *   de 'AI_PROVIDER' aquí. IaService (el kernel) NO se toca.
 *
 * PRINCIPIO DIP (Dependency Inversion Principle):
 *   IaService recibe 'AI_PROVIDER' que cumple la interfaz IAIProvider.
 *   No depende de Groq directamente — depende de la abstracción.
 *
 * Para agregar un nuevo plug-in (ejemplo OpenAI):
 *   1. Crear OpenAIProvider en ./providers/openai.provider.ts
 *   2. Cambiar useFactory para devolver new OpenAIProvider(...)
 *   3. IaService funciona sin cambios.
 */
@Module({
  controllers: [IaController],
  providers: [
    {
      // MICROKERNEL: factory provider que instancia el plug-in activo
      provide: 'AI_PROVIDER',
      useFactory: (configService: ConfigService) => {
        const groq = new Groq({ apiKey: configService.get<string>('GROQ_API_KEY') ?? '' });
        return new GroqProvider(groq);
      },
      inject: [ConfigService],
    },
    IaService,
  ],
  exports: [IaService],
})
export class IaModule {}
