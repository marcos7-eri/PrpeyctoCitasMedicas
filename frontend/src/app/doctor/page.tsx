'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminStyles as styles } from '@/styles/adminStyles';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';

interface CitaProxima {
  id: string;
  paciente_nombre: string;
  fecha: string;
  hora_inicio: string;
  estado: string;
  motivo: string | null;
}

export default function DashboardDoctor() {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  const [stats, setStats] = useState({ citasHoy: 0, citasPendientes: 0, totalPacientes: 0, notificacionesNoLeidas: 0, horariosActivos: 0, atendidosHoy: 0 });
  const [citasProximas, setCitasProximas] = useState<CitaProxima[]>([]);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [perfilId, setPerfilId] = useState<string | null>(null);

  useEffect(() => { obtenerDoctorId(); }, []);
  useEffect(() => { if (doctorId && perfilId) cargarDashboard(); }, [doctorId, perfilId]);

  const obtenerDoctorId = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        setPerfilId(userData.user.id);
        const doctores = await api.get<any[]>(`/doctores?perfil_id=${userData.user.id}`);
        if (doctores && doctores.length > 0) setDoctorId(doctores[0].id);
      }
    } catch (error) { console.error('Error obteniendo doctor ID:', error); } finally { setCargando(false); }
  };

  const cargarDashboard = async () => {
    if (!doctorId || !perfilId) return;
    try {
      setCargando(true);
      const hoy = new Date().toISOString().split('T')[0];
      const [citas, notificaciones, horarios] = await Promise.all([
        api.get<any[]>(`/citas?doctor_id=${doctorId}`),
        api.get<any[]>(`/notificaciones?usuario_id=${perfilId}`),
        api.get<any[]>(`/horarios?doctor_id=${doctorId}&activo=true`),
      ]);

      const citasHoy = citas.filter((c: any) => c.fecha === hoy).length;
      const atendidosHoy = citas.filter((c: any) => c.fecha === hoy && c.estado === 'completada').length;
      const citasPendientes = citas.filter((c: any) => c.estado === 'pendiente').length;
      const pacientesUnicos = new Set(citas.map((c: any) => c.paciente_id).filter(Boolean));
      const notificacionesNoLeidas = notificaciones.filter((n: any) => !n.leido).length;
      const horariosActivos = (horarios || []).length;

      const proximas = citas
        .filter((c: any) => c.fecha >= hoy)
        .sort((a: any, b: any) => a.fecha.localeCompare(b.fecha) || a.hora_inicio.localeCompare(b.hora_inicio))
        .slice(0, 5)
        .map((cita: any) => ({
          id: cita.id,
          paciente_nombre: cita.pacientes?.perfiles?.nombre_completo || 'Paciente',
          fecha: cita.fecha,
          hora_inicio: cita.hora_inicio,
          estado: cita.estado,
          motivo: cita.motivo,
        }));

      setStats({ citasHoy, citasPendientes, totalPacientes: pacientesUnicos.size, notificacionesNoLeidas, horariosActivos, atendidosHoy });
      setCitasProximas(proximas);
    } catch (error) { console.error('Error cargando dashboard:', error); } finally { setCargando(false); }
  };

  const getEstadoBadge = (estado: string): React.CSSProperties => {
    if (estado === 'pendiente') return styles.badgePendiente;
    if (estado === 'confirmada') return styles.badgeConfirmado;
    if (estado === 'cancelada') return styles.badgeCancelada;
    if (estado === 'completada') return styles.badgeCompletada;
    return styles.badgePendiente;
  };

  const getEstadoTexto = (estado: string) => ({ pendiente: 'Pendiente', confirmada: 'Confirmada', cancelada: 'Cancelada', completada: 'Completada' }[estado] || estado);

  if (cargando) return <div style={styles.emptyState}><p>Cargando panel de control...</p></div>;

  return (
    <>
      <div style={styles.cardsGrid}>
        <div style={styles.card}><p style={styles.cardTitle}>Citas de hoy</p><h3 style={styles.cardValue}>{stats.citasHoy}</h3><p style={styles.cardSubtitle}>{stats.citasPendientes} pendientes</p></div>
        <div style={styles.card}><p style={styles.cardTitle}>Pacientes atendidos</p><h3 style={styles.cardValue}>{stats.totalPacientes}</h3><p style={styles.cardSubtitle}>Total de pacientes</p></div>
        <div style={styles.card}><p style={styles.cardTitle}>Horarios activos</p><h3 style={styles.cardValue}>{stats.horariosActivos}</h3><p style={styles.cardSubtitle}>Configurar horarios</p></div>
        <div style={styles.card}><p style={styles.cardTitle}>Notificaciones</p><h3 style={styles.cardValue}>{stats.notificacionesNoLeidas}</h3><p style={styles.cardSubtitle}>Sin leer</p></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div style={styles.tableBox}>
          <div style={styles.tableHeader}>
            <h3 style={styles.tableTitle}>Próximas citas</h3>
            <button style={styles.btnSecondary} onClick={() => router.push('/doctor/citas')}>Ver todas</button>
          </div>
          {citasProximas.length === 0 ? (
            <div style={styles.emptyState}>
              <p>No hay citas programadas</p>
              <button onClick={() => router.push('/doctor/citas')} style={{ ...styles.btnPrimary, marginTop: '12px' }}>Crear cita</button>
            </div>
          ) : (
            <div style={styles.tableResponsive}>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>Paciente</th><th style={styles.th}>Fecha</th><th style={styles.th}>Hora</th><th style={styles.th}>Estado</th><th style={styles.th}>Motivo</th></tr></thead>
                <tbody>
                  {citasProximas.map((cita) => (
                    <tr key={cita.id} style={{ cursor: 'pointer' }} onClick={() => router.push('/doctor/citas')}>
                      <td style={styles.td}><strong>{cita.paciente_nombre}</strong></td>
                      <td style={styles.td}>{new Date(cita.fecha).toLocaleDateString('es-ES')}</td>
                      <td style={styles.td}><span style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '8px', fontSize: '12px', fontFamily: 'monospace' }}>{cita.hora_inicio.substring(0, 5)}</span></td>
                      <td style={styles.td}><span style={getEstadoBadge(cita.estado)}>{getEstadoTexto(cita.estado)}</span></td>
                      <td style={styles.td}>{cita.motivo ? (cita.motivo.length > 30 ? cita.motivo.substring(0, 30) + '...' : cita.motivo) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={styles.tableBox}>
          <div style={styles.tableHeader}><h3 style={styles.tableTitle}>Acciones rápidas</h3></div>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button style={styles.btnPrimary} onClick={() => router.push('/doctor/citas')}>Nueva cita</button>
            <button style={styles.btnSecondary} onClick={() => router.push('/doctor/horarios')}>Agregar horario</button>
            <button style={styles.btnSecondary} onClick={() => router.push('/doctor/historial')}>Ver historial</button>
            <button style={styles.btnSecondary} onClick={() => router.push('/doctor/notificaciones')}>Ver notificaciones</button>
          </div>
          <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#FFFFFF', margin: '0 0 16px 0' }}>Resumen del día</h3>
            <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
              <div><p style={{ fontSize: '28px', fontWeight: '700', color: '#319795', margin: 0 }}>{stats.citasHoy}</p><p style={{ fontSize: '12px', color: '#94A3B8', margin: '4px 0 0' }}>Citas</p></div>
              <div><p style={{ fontSize: '28px', fontWeight: '700', color: '#319795', margin: 0 }}>{stats.atendidosHoy}</p><p style={{ fontSize: '12px', color: '#94A3B8', margin: '4px 0 0' }}>Atendidos</p></div>
              <div><p style={{ fontSize: '28px', fontWeight: '700', color: '#319795', margin: 0 }}>{stats.citasPendientes}</p><p style={{ fontSize: '12px', color: '#94A3B8', margin: '4px 0 0' }}>Pendientes</p></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
