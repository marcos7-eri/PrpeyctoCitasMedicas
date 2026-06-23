import { BadRequestException, InternalServerErrorException } from '@nestjs/common';

/**
 * PRINCIPIO DRY (Don't Repeat Yourself):
 * En el proyecto, TODOS los servicios repetían el mismo bloque try/catch:
 *
 *   } catch (err: any) {
 *     if (err instanceof BadRequestException) throw err;
 *     throw new InternalServerErrorException(err.message || 'Error interno');
 *   }
 *
 * Esta función centraliza esa lógica. Cada algoritmo se crea una vez y se reutiliza.
 * Cambiar el comportamiento de error solo requiere modificar este único punto.
 *
 * PRINCIPIO SRP (Single Responsibility Principle):
 * Separar el manejo de errores de la lógica de negocio de cada servicio.
 */
export async function handleDbOperation<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (err: any) {
    // Re-lanzar excepciones HTTP conocidas sin envolverlas
    if (
      err instanceof BadRequestException ||
      err instanceof InternalServerErrorException
    ) {
      throw err;
    }
    throw new InternalServerErrorException(err.message || 'Error interno del servidor');
  }
}
