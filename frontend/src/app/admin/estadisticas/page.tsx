'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface Estadisticas {
  kpis: {
    totalCitas: number; citasHoy: number; citasMes: number;
    tasaCancelacion: number; totalPacientes: number; totalDoctores: number;
  };
  porEstado: { estado: string; count: number }[];
  porDia: { fecha: string; dia: string; citas: number }[];
  doctoresActivos: { nombre: string; count: number }[];
  pacientesPorMes: { mes: string; pacientes: number }[];
}

const ESTADO_COLORS: Record<string, string> = {
  pendiente: '#F59E0B', confirmada: '#10B981',
  completada: '#6366F1', cancelada: '#EF4444',
};
const ESTADO_LABELS: Record<string, string> = {
  pendiente: 'Pendiente', confirmada: 'Confirmada',
  completada: 'Completada', cancelada: 'Cancelada',
};
const PIE_COLORS = ['#F59E0B', '#10B981', '#6366F1', '#EF4444', '#06B6D4'];

const KPI_CONFIG = [
  { key: 'totalCitas',      label: 'Total citas',    color: '#6366F1', sub: 'registradas' },
  { key: 'citasHoy',        label: 'Citas hoy',      color: '#2DD4BF', sub: 'programadas' },
  { key: 'citasMes',        label: 'Este mes',       color: '#10B981', sub: 'citas del mes' },
  { key: 'tasaCancelacion', label: 'Cancelaciones',  color: '#EF4444', sub: '% del total', suffix: '%' },
  { key: 'totalPacientes',  label: 'Pacientes',      color: '#F59E0B', sub: 'registrados' },
  { key: 'totalDoctores',   label: 'Doctores',       color: '#8B5CF6', sub: 'activos' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0F2035', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px' }}>
      <p style={{ color: '#94A3B8', fontSize: 12, margin: '0 0 4px' }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || '#2DD4BF', fontSize: 14, fontWeight: 700, margin: 0 }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function EstadisticasPage() {
  const [datos, setDatos] = useState<Estadisticas | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.get<Estadisticas>('/estadisticas')
      .then(d => setDatos(d))
      .catch(console.error)
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, gap: 12 }}>
      <div style={{ width: 32, height: 32, border: '3px solid #2DD4BF', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ color: '#94A3B8', fontSize: 15 }}>Cargando estadísticas...</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!datos) return <div style={{ color: '#EF4444', padding: 24 }}>No se pudieron cargar las estadísticas.</div>;

  const { kpis, porEstado, porDia, doctoresActivos, pacientesPorMes } = datos;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
        {KPI_CONFIG.map(({ key, label, color, sub, suffix }) => (
          <div key={key} style={{
            background: 'rgba(15,32,53,0.8)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 16, padding: '18px 20px',
            borderTop: `3px solid ${color}`,
          }}>
            <div style={{ color, fontSize: 28, fontWeight: 800, lineHeight: 1 }}>
              {(kpis as any)[key]}{suffix ?? ''}
            </div>
            <div style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 600, marginTop: 4 }}>{label}</div>
            <div style={{ color: '#64748B', fontSize: 11, marginTop: 2 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Row 1: Citas por día + Distribución por estado */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>

        {/* Citas por día (bar chart) */}
        <div style={cardStyle}>
          <h3 style={titleStyle}>Citas últimos 14 días</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={porDia} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="dia" tick={{ fill: '#64748B', fontSize: 10 }} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: '#64748B', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="citas" name="Citas" fill="#2DD4BF" radius={[6, 6, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Distribución por estado (pie) */}
        <div style={cardStyle}>
          <h3 style={titleStyle}>Por estado</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={porEstado}
                dataKey="count"
                nameKey="estado"
                cx="50%" cy="50%"
                innerRadius={55} outerRadius={85}
                paddingAngle={3}
              >
                {porEstado.map((entry, i) => (
                  <Cell key={i} fill={ESTADO_COLORS[entry.estado] || PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n) => [v, ESTADO_LABELS[n as string] || n]} contentStyle={{ background: '#0F2035', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} itemStyle={{ color: '#E2E8F0' }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
            {porEstado.map((e, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: ESTADO_COLORS[e.estado] || PIE_COLORS[i] }} />
                <span style={{ color: '#94A3B8', fontSize: 11 }}>{ESTADO_LABELS[e.estado] || e.estado}: {e.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Doctores activos + Pacientes nuevos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Doctores más activos (horizontal bar) */}
        <div style={cardStyle}>
          <h3 style={titleStyle}>Doctores más activos</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={doctoresActivos} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#64748B', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="nombre" tick={{ fill: '#94A3B8', fontSize: 11 }} tickLine={false} width={90} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Citas" fill="#6366F1" radius={[0, 6, 6, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pacientes nuevos por mes (line chart) */}
        <div style={cardStyle}>
          <h3 style={titleStyle}>Pacientes nuevos por mes</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={pacientesPorMes} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="mes" tick={{ fill: '#64748B', fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fill: '#64748B', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone" dataKey="pacientes" name="Pacientes"
                stroke="#F59E0B" strokeWidth={2.5}
                dot={{ fill: '#F59E0B', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(15,32,53,0.8)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 16, padding: '20px 22px',
};

const titleStyle: React.CSSProperties = {
  color: '#FFFFFF', fontSize: 15, fontWeight: 700,
  margin: '0 0 16px', letterSpacing: '-0.02em',
};
