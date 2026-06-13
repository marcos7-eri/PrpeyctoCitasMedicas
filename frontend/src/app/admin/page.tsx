'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminStyles as styles } from '@/styles/adminStyles';
import { api } from '@/lib/api';

interface CitaReciente {
  id: string;
  paciente_nombre: string;
  doctor_nombre: string;
  fecha: string;
  hora_inicio: string;
  estado: string;
  motivo: string | null;
}

export default function DashboardAdmin() {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  const [stats, setStats] = useState({
    doctores: 0,
    pacientes: 0,
    citasHoy: 0,
    citasPendientes: 0,
    notificacionesNoLeidas: 0,
  });
  const [citasRecientes, setCitasRecientes] = useState<CitaReciente[]>([]);

  useEffect(() => {
    cargarDashboard();
  }, []);

  const cargarDashboard = async () => {
    try {
      setCargando(true);
      const hoy = new Date().toISOString().split('T')[0];
      const [doctores, pacientes, citas, notificaciones] = await Promise.all([
        api.get<any[]>('/doctores'),
        api.get<any[]>('/pacientes'),
        api.get<any[]>('/citas'),
        api.get<any[]>('/notificaciones'),
      ]);

      const citasHoy = citas.filter((c: any) => c.fecha === hoy).length;
      const citasPendientes = citas.filter((c: any) => c.estado === 'pendiente').length;
      const notificacionesNoLeidas = notificaciones.filter((n: any) => !n.leido).length;

      const proximas = [...citas]
        .filter((c: any) => c.fecha >= hoy)
        .sort((a: any, b: any) => a.fecha.localeCompare(b.fecha) || a.hora_inicio.localeCompare(b.hora_inicio))
        .slice(0, 5)
        .map((cita: any) => ({
          id: cita.id,
          paciente_nombre: cita.pacientes?.perfiles?.nombre_completo || 'Paciente desconocido',
          doctor_nombre: cita.doctores?.perfiles?.nombre_completo || 'Doctor desconocido',
          fecha: cita.fecha,
          hora_inicio: cita.hora_inicio,
          estado: cita.estado,
          motivo: cita.motivo,
        }));

      setStats({
        doctores: doctores.length,
        pacientes: pacientes.length,
        citasHoy,
        citasPendientes,
        notificacionesNoLeidas,
      });
      setCitasRecientes(proximas);
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setCargando(false);
    }
  };

  const getEstadoBadge = (estado: string): React.CSSProperties => {
    const v = estado.toLowerCase();
    if (v === 'pendiente') return styles.badgePendiente;
    if (v === 'confirmada') return styles.badgeConfirmado;
    if (v === 'cancelada') return styles.badgeCancelada;
    if (v === 'completada') return styles.badgeCompletada;
    return styles.badgePendiente;
  };

  const getEstadoTexto = (estado: string): string => {
    const textos: Record<string, string> = { pendiente: 'Pendiente', confirmada: 'Confirmada', cancelada: 'Cancelada', completada: 'Completada' };
    return textos[estado?.toLowerCase()] || estado;
  };

  if (cargando) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.spinner}></div>
        <p>Cargando panel de control...</p>
      </div>
    );
  }

  return (
    <>
      <div style={styles.cardsGrid}>
        <div style={styles.card}><p style={styles.cardTitle}>Doctores</p><h3 style={styles.cardValue}>{stats.doctores}</h3><p style={styles.cardSubtitle}>Profesionales registrados</p></div>
        <div style={styles.card}><p style={styles.cardTitle}>Pacientes</p><h3 style={styles.cardValue}>{stats.pacientes}</h3><p style={styles.cardSubtitle}>Pacientes en el sistema</p></div>
        <div style={styles.card}><p style={styles.cardTitle}>Citas hoy</p><h3 style={styles.cardValue}>{stats.citasHoy}</h3><p style={styles.cardSubtitle}>Para el día de hoy</p></div>
        <div style={styles.card}><p style={styles.cardTitle}>Pendientes</p><h3 style={styles.cardValue}>{stats.citasPendientes}</h3><p style={styles.cardSubtitle}>Citas por confirmar</p></div>
        <div style={styles.card}><p style={styles.cardTitle}>No leídas</p><h3 style={styles.cardValue}>{stats.notificacionesNoLeidas}</h3><p style={styles.cardSubtitle}>Notificaciones pendientes</p></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div style={styles.tableBox}>
          <div style={styles.tableHeader}>
            <h3 style={styles.tableTitle}>Próximas citas</h3>
            <button style={styles.btnSecondary} onClick={() => router.push('/admin/citas')}>Ver todas</button>
          </div>
          {citasRecientes.length === 0 ? (
            <div style={styles.emptyState}>
              <p>No hay citas programadas</p>
              <button onClick={() => router.push('/admin/citas')} style={{ ...styles.btnPrimary, marginTop: '12px' }}>Crear primera cita</button>
            </div>
          ) : (
            <div style={styles.tableResponsive}>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>Paciente</th><th style={styles.th}>Doctor</th><th style={styles.th}>Fecha</th><th style={styles.th}>Hora</th><th style={styles.th}>Estado</th></tr></thead>
                <tbody>
                  {citasRecientes.map((cita) => (
                    <tr key={cita.id} style={{ cursor: 'pointer' }} onClick={() => router.push('/admin/citas')}>
                      <td style={styles.td}>
                        <strong>{cita.paciente_nombre}</strong>
                        {cita.motivo && <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>{cita.motivo.length > 40 ? cita.motivo.substring(0, 40) + '...' : cita.motivo}</div>}
                      </td>
                      <td style={styles.td}>{cita.doctor_nombre}</td>
                      <td style={styles.td}>{new Date(cita.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</td>
                      <td style={styles.td}><span style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '8px', fontSize: '12px', fontFamily: 'monospace' }}>{cita.hora_inicio?.substring(0, 5)}</span></td>
                      <td style={styles.td}><span style={getEstadoBadge(cita.estado)}>{getEstadoTexto(cita.estado)}</span></td>
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
            <button style={styles.btnPrimary} onClick={() => router.push('/admin/doctores')}>Registrar nuevo doctor</button>
            <button style={styles.btnSecondary} onClick={() => router.push('/admin/especialidades')}>Crear especialidad</button>
            <button style={styles.btnSecondary} onClick={() => router.push('/admin/citas')}>Gestionar citas</button>
            <button style={styles.btnSecondary} onClick={() => router.push('/admin/notificaciones')}>Enviar notificación</button>
            <button style={styles.btnSecondary} onClick={() => router.push('/admin/auditoria')}>Ver auditoría</button>
          </div>
        </div>
      </div>
    </>
  );
}
