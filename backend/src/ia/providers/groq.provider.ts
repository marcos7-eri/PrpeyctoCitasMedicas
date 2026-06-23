import { InternalServerErrorException } from '@nestjs/common';
import Groq from 'groq-sdk';
import { IAIProvider, ChatMessage } from '../../interfaces/IAIProvider';

const MODELO = 'llama-3.3-70b-versatile';

/**
 * ARQUITECTURA MICROKERNEL — Plug-in concreto de IA.
 *
 * GroqProvider es un PLUG-IN que extiende las capacidades del kernel (IaService).
 * El kernel no sabe cómo funciona Groq internamente — solo conoce la interfaz IAIProvider.
 *
 * PRINCIPIO OCP (Open/Closed Principle):
 * Para agregar un nuevo proveedor (OpenAI, Gemini, Ollama), se crea otra clase
 * que implemente IAIProvider. IaService NO se modifica — está cerrado para modificación.
 *
 * PRINCIPIO LSP (Liskov Substitution Principle):
 * GroqProvider puede sustituir a cualquier otro IAIProvider en IaService
 * sin alterar el comportamiento observable del sistema.
 *
 * PRINCIPIO SRP (Single Responsibility Principle):
 * Esta clase tiene una sola responsabilidad: comunicarse con la API de Groq.
 * No maneja sesiones, ni BD, ni lógica médica.
 */
export class GroqProvider implements IAIProvider {
  readonly nombre = 'Groq / LLaMA-3.3-70b';

  constructor(private readonly groq: Groq) {}

  /**
   * Genera una respuesta de chat enviando el historial y el prompt al modelo Groq.
   * Traduce de ChatMessage (formato interno) al formato de la API de Groq.
   */
  async generarRespuesta(
    mensajes: ChatMessage[],
    systemPrompt: string,
    maxTokens = 450,
  ): Promise<string> {
    try {
      const res = await this.groq.chat.completions.create({
        model:       MODELO,
        max_tokens:  maxTokens,
        temperature: 0.7,
        messages: [
          { role: 'system', content: systemPrompt },
          ...mensajes.map(m => ({
            role:    m.rol as 'user' | 'assistant',
            content: m.contenido,
          })),
        ],
      });
      return res.choices[0].message.content ?? '';
    } catch (err: any) {
      const detail = err?.error?.message || err?.message || 'Error desconocido de Groq';
      throw new InternalServerErrorException(`[GroqProvider] ${detail}`);
    }
  }

  /**
   * Genera un resumen breve de una conversación médica.
   * Reutiliza la misma conexión Groq con parámetros distintos (DRY).
   */
  async generarResumen(texto: string): Promise<string> {
    try {
      const res = await this.groq.chat.completions.create({
        model:      MODELO,
        max_tokens: 150,
        messages: [
          { role: 'system', content: 'Resume consultas médicas en 2-3 líneas en español.' },
          { role: 'user',   content: `Resume esta consulta médica (síntomas, recomendación, urgencia):\n\n${texto}` },
        ],
      });
      return res.choices[0].message.content ?? '';
    } catch {
      // El resumen es opcional — si falla, se guarda null en la sesión
      return '';
    }
  }
}
