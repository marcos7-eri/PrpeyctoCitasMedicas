/**
 * ARQUITECTURA MICROKERNEL:
 * Esta interfaz es el "API del kernel" que todo plug-in de IA debe implementar.
 * El núcleo (IaService) define el contrato; los plug-ins lo implementan.
 *
 * PRINCIPIO OCP (Open/Closed Principle):
 * Se pueden añadir nuevos proveedores de IA (OpenAI, Gemini, Ollama)
 * sin modificar el código del IaService (cerrado para modificación,
 * abierto para extensión mediante nuevos plug-ins).
 *
 * PRINCIPIO LSP (Liskov Substitution Principle):
 * Cualquier IAIProvider concreto (GroqProvider, OpenAIProvider, etc.)
 * puede sustituir a otro sin alterar el comportamiento del sistema.
 *
 * PRINCIPIO DIP (Dependency Inversion Principle):
 * IaService depende de esta abstracción, no de Groq directamente.
 */
export interface ChatMessage {
  rol: 'user' | 'assistant';
  contenido: string;
}

export interface IAIProvider {
  /** Nombre identificador del proveedor — útil para logs y diagnóstico */
  readonly nombre: string;

  /**
   * Genera una respuesta de chat dado el historial de mensajes y un prompt de sistema.
   * Cada plug-in implementa este método con su propio modelo/API.
   */
  generarRespuesta(
    mensajes: ChatMessage[],
    systemPrompt: string,
    maxTokens?: number,
  ): Promise<string>;

  /**
   * Genera un resumen breve de una conversación médica.
   * Permite reutilizar el mismo proveedor para distintas tareas.
   */
  generarResumen(texto: string): Promise<string>;
}
