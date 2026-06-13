import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class EstadisticasService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getResumen() {
    const hoy = new Date().toISOString().split('T')[0];
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString().split('T')[0];

    // Últimos 14 días para el gráfico de tendencia
    const hace14 = new Date();
    hace14.setDate(hace14.getDate() - 13);
    const desde14 = hace14.toISOString().split('T')[0];

    const [
      { data: todasCitas },
      { data: pacientes },
      { data: doctores },
      { data: citasUltimas14 },
    ] = await Promise.all([
      this.supabaseService.client
        .from('citas')
        .select('id, fecha, estado, doctor_id, doctores(perfiles(nombre_completo))'),
      this.supabaseService.client.from('pacientes').select('id, creado_en'),
      this.supabaseService.client.from('doctores').select('id, especialidades(nombre)'),
      this.supabaseService.client
        .from('citas')
        .select('id, fecha, estado')
        .gte('fecha', desde14)
        .order('fecha'),
    ]);

    const citas = todasCitas ?? [];

    // KPIs
    const totalCitas        = citas.length;
    const citasHoy          = citas.filter((c: any) => c.fecha === hoy).length;
    const citasMes          = citas.filter((c: any) => c.fecha >= inicioMes).length;
    const canceladas        = citas.filter((c: any) => c.estado === 'cancelada').length;
    const tasaCancelacion   = totalCitas > 0 ? Math.round((canceladas / totalCitas) * 100) : 0;
    const totalPacientes    = (pacientes ?? []).length;
    const totalDoctores     = (doctores ?? []).length;

    // Por estado (pie chart)
    const estadoMap: Record<string, number> = {};
    for (const c of citas as any[]) {
      estadoMap[c.estado] = (estadoMap[c.estado] ?? 0) + 1;
    }
    const porEstado = Object.entries(estadoMap).map(([estado, count]) => ({ estado, count }));

    // Por día (últimos 14 días) — bar chart
    const diaMap: Record<string, number> = {};
    for (const c of (citasUltimas14 ?? []) as any[]) {
      diaMap[c.fecha] = (diaMap[c.fecha] ?? 0) + 1;
    }
    // Rellenar días sin citas con 0
    const porDia: { fecha: string; dia: string; citas: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const fechaStr = d.toISOString().split('T')[0];
      const dia = d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
      porDia.push({ fecha: fechaStr, dia, citas: diaMap[fechaStr] ?? 0 });
    }

    // Doctores más activos — top 6 (bar chart)
    const doctorMap: Record<string, { nombre: string; count: number }> = {};
    for (const c of citas as any[]) {
      const id = c.doctor_id;
      const nombre = c.doctores?.perfiles?.nombre_completo ?? 'Doctor';
      if (!doctorMap[id]) doctorMap[id] = { nombre, count: 0 };
      doctorMap[id].count++;
    }
    const doctoresActivos = Object.values(doctorMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // Pacientes nuevos por mes (últimos 6 meses)
    const pacientesPorMes: { mes: string; pacientes: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mes = d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
      const inicio = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
      const fin    = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString();
      const count  = (pacientes ?? []).filter(
        (p: any) => p.creado_en >= inicio && p.creado_en <= fin,
      ).length;
      pacientesPorMes.push({ mes, pacientes: count });
    }

    return {
      kpis: { totalCitas, citasHoy, citasMes, tasaCancelacion, totalPacientes, totalDoctores },
      porEstado,
      porDia,
      doctoresActivos,
      pacientesPorMes,
    };
  }
}
