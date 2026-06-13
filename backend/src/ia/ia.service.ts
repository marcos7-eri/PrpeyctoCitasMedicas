import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import Groq from 'groq-sdk';

const MODELO = 'llama-3.3-70b-versatile';

const SISTEMA_PROMPT = `Eres AsistenteMed, un asistente médico virtual en español para una clínica. Tu rol es ayudar a pacientes a entender sus síntomas y orientarlos sobre qué tipo de médico consultar.

REGLAS OBLIGATORIAS:
- Responde SIEMPRE en español con empatía y lenguaje simple (evita tecnicismos)
- NUNCA emitas diagnósticos definitivos — siempre di "podría ser", "es posible que"
- SIEMPRE recomienda consultar a un médico real
- Máximo 130 palabras por respuesta — sé conciso y claro
- Si hay señales de emergencia, ponlo en MAYÚSCULAS al inicio y recomienda llamar al 911

SEÑALES DE EMERGENCIA (urgencia = "emergencia"):
- Dolor de pecho intenso o presión en el pecho
- Dificultad severa para respirar
- Pérdida o alteración repentina de consciencia
- Sangrado severo incontrolable
- Parálisis facial súbita, confusión, dificultad para hablar
- Convulsiones

ESPECIALIDADES DISPONIBLES EN LA CLÍNICA:
Cardiología, Dermatología, Gastroenterología, Ginecología, Medicina General,
Neurología, Oftalmología, Ortopedia, Otorrinolaringología, Pediatría,
Psiquiatría, Urología, Traumatología, Endocrinología

AL FINAL de CADA respuesta, en una línea separada, agrega exactamente:
[META:{"urgencia":"normal","especialidad":"Medicina General","agendar":false}]
Reemplaza los valores: urgencia = "normal" | "urgente" | "emergencia", especialidad = la más apropiada, agendar = true si recomiendas agendar cita.`;

@Injectable()
export class IaService {
  private groq: Groq;

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService,
  ) {
    this.groq = new Groq({
      apiKey: this.configService.get<string>('GROQ_API_KEY') ?? '',
    });
  }

  // ─── Sesiones ────────────────────────────────────────────────────────────

  async iniciarSesion(pacienteId: string) {
    const { data, error } = await this.supabaseService.client
      .from('chat_sesiones')
      .insert({ paciente_id: pacienteId })
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async obtenerSesion(sesionId: string) {
    const { data, error } = await this.supabaseService.client
      .from('chat_sesiones')
      .select('*')
      .eq('id', sesionId)
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async obtenerMensajes(sesionId: string) {
    const { data, error } = await this.supabaseService.client
      .from('chat_mensajes')
      .select('*')
      .eq('sesion_id', sesionId)
      .order('creado_en', { ascending: true });
    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  async cerrarSesion(sesionId: string) {
    const mensajes = await this.obtenerMensajes(sesionId);
    let resumen: string | null = null;

    if (mensajes.length >= 2) {
      try {
        const texto = mensajes
          .map((m: any) => `${m.rol === 'usuario' ? 'Paciente' : 'Asistente'}: ${m.contenido}`)
          .join('\n');
        const res = await this.groq.chat.completions.create({
          model: MODELO,
          max_tokens: 150,
          messages: [
            { role: 'system', content: 'Resume consultas médicas en 2-3 líneas en español.' },
            { role: 'user', content: `Resume esta consulta médica (síntomas, recomendación, urgencia):\n\n${texto}` },
          ],
        });
        resumen = res.choices[0].message.content ?? null;
      } catch { /* resumen queda null */ }
    }

    const { data, error } = await this.supabaseService.client
      .from('chat_sesiones')
      .update({ cerrada_en: new Date().toISOString(), resumen })
      .eq('id', sesionId)
      .select()
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  // ─── Contexto del paciente ────────────────────────────────────────────────

  private async obtenerContextoPaciente(pacienteId: string): Promise<string> {
    const [{ data: paciente }, { data: historial }, { data: citas }] = await Promise.all([
      this.supabaseService.client
        .from('pacientes')
        .select('fecha_nacimiento, genero, tipo_sangre, perfiles(nombre_completo)')
        .eq('id', pacienteId)
        .single(),
      this.supabaseService.client
        .from('historial_medico')
        .select('id, sintomas, diagnostico, tratamiento, fecha_registro')
        .eq('paciente_id', pacienteId)
        .order('fecha_registro', { ascending: false })
        .limit(5),
      this.supabaseService.client
        .from('citas')
        .select('fecha, motivo, doctores(especialidades(nombre))')
        .eq('paciente_id', pacienteId)
        .eq('estado', 'completada')
        .order('fecha', { ascending: false })
        .limit(4),
    ]);

    const nombre = (paciente as any)?.perfiles?.nombre_completo || 'Paciente';
    const edad   = paciente?.fecha_nacimiento
      ? `${Math.floor((Date.now() - new Date(paciente.fecha_nacimiento).getTime()) / 31536000000)} años`
      : 'No registrada';

    let ctx = `PACIENTE: ${nombre} | Edad: ${edad} | Género: ${paciente?.genero || 'N/R'} | Sangre: ${paciente?.tipo_sangre || 'N/R'}\n`;

    if (historial && historial.length > 0) {
      const ids = historial.map((h: any) => h.id);
      const { data: recetas } = await this.supabaseService.client
        .from('recetas')
        .select('medicamento, dosis, frecuencia')
        .in('historial_id', ids)
        .limit(8);

      ctx += '\nHISTORIAL:\n';
      historial.forEach((h: any) => {
        ctx += `• ${new Date(h.fecha_registro).toLocaleDateString('es-ES')}: ${h.sintomas || ''} → ${h.diagnostico || 'sin diagnóstico'}\n`;
      });

      if (recetas && recetas.length > 0) {
        ctx += '\nMEDICAMENTOS:\n';
        recetas.forEach((r: any) => { ctx += `• ${r.medicamento} ${r.dosis || ''} ${r.frecuencia || ''}\n`; });
      }
    }

    if (citas && citas.length > 0) {
      ctx += '\nCITAS PREVIAS:\n';
      citas.forEach((c: any) => {
        const esp = (c as any).doctores?.especialidades?.nombre || '';
        ctx += `• ${c.fecha} (${esp}): ${c.motivo || 'N/A'}\n`;
      });
    }

    return ctx;
  }

  // ─── Chat principal ───────────────────────────────────────────────────────

  async chat(pacienteId: string, sesionId: string | undefined, mensaje: string) {
    try {
      const sesion = sesionId
        ? await this.obtenerSesion(sesionId)
        : await this.iniciarSesion(pacienteId);

      const [contexto, mensajesDB] = await Promise.all([
        this.obtenerContextoPaciente(pacienteId),
        this.obtenerMensajes(sesion.id),
      ]);

      const systemPrompt = `${SISTEMA_PROMPT}\n\n${contexto}`;

      // Historial en formato user/assistant (igual que Anthropic)
      const historial: { role: 'user' | 'assistant'; content: string }[] =
        (mensajesDB as any[]).slice(-18).map(m => ({
          role: m.rol === 'usuario' ? 'user' : 'assistant',
          content: m.contenido as string,
        }));

      let fullText: string;
      try {
        const res = await this.groq.chat.completions.create({
          model: MODELO,
          max_tokens: 450,
          temperature: 0.7,
          messages: [
            { role: 'system', content: systemPrompt },
            ...historial,
            { role: 'user', content: mensaje },
          ],
        });
        fullText = res.choices[0].message.content ?? '';
      } catch (groqErr: any) {
        const detail = groqErr?.error?.message || groqErr?.message || 'Error desconocido';
        console.error('[IA] Groq error:', detail);
        throw new InternalServerErrorException(`Error IA: ${detail}`);
      }

      // Extraer metadata del bloque [META:...]
      const metaMatch = fullText.match(/\[META:(.*?)\]/s);
      let meta = { urgencia: 'normal', especialidad: 'Medicina General', agendar: false };
      let respuesta = fullText;

      if (metaMatch) {
        try { meta = JSON.parse(metaMatch[1]); } catch { /* mantener defaults */ }
        respuesta = fullText.replace(/\n?\[META:.*?\]/s, '').trim();
      }

      // Guardar mensajes
      await this.supabaseService.client.from('chat_mensajes').insert([
        { sesion_id: sesion.id, rol: 'usuario',    contenido: mensaje },
        {
          sesion_id: sesion.id, rol: 'asistente', contenido: respuesta,
          metadata: {
            urgencia:             meta.urgencia,
            especialidad_sugerida: meta.especialidad,
            recomienda_agendar:   meta.agendar,
            es_emergencia:        meta.urgencia === 'emergencia',
          },
        },
      ]);

      return {
        sesion_id:             sesion.id,
        respuesta,
        urgencia:              meta.urgencia,
        especialidad_sugerida: meta.especialidad,
        recomienda_agendar:    meta.agendar,
        es_emergencia:         meta.urgencia === 'emergencia',
      };
    } catch (err: any) {
      if (err instanceof BadRequestException || err instanceof InternalServerErrorException) throw err;
      throw new InternalServerErrorException(err.message || 'Error en el servicio de IA');
    }
  }
}
