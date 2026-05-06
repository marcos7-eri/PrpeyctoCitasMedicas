import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { adminStyles as styles } from './admin';
import { supabase } from '../../lib/supabase';

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
  const navigate = useNavigate();
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

      const [
        doctoresRes,
        pacientesRes,
        citasHoyRes,
        citasPendientesRes,
        notificacionesRes,
        citasRes,
      ] = await Promise.all([
        supabase.from('doctores').select('*', { count: 'exact', head: true }),
        supabase.from('pacientes').select('*', { count: 'exact', head: true }),
        supabase.from('citas').select('*', { count: 'exact', head: true }).eq('fecha', hoy),
        supabase.from('citas').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente'),
        supabase.from('notificaciones').select('id').eq('leido', false),
        supabase
          .from('citas')
          .select(`
            id,
            fecha,
            hora_inicio,
            estado,
            motivo,
            pacientes (
              perfiles (
                nombre_completo
              )
            ),
            doctores (
              perfiles (
                nombre_completo
              )
            )
          `)
          .order('fecha', { ascending: true })
          .order('hora_inicio', { ascending: true })
          .limit(5),
      ]);

      if (doctoresRes.error) {
        console.error('Error al contar doctores:', doctoresRes.error);
      }

      if (pacientesRes.error) {
        console.error('Error al contar pacientes:', pacientesRes.error);
      }

      if (citasHoyRes.error) {
        console.error('Error al contar citas de hoy:', citasHoyRes.error);
      }

      if (citasPendientesRes.error) {
        console.error('Error al contar citas pendientes:', citasPendientesRes.error);
      }

      if (notificacionesRes.error) {
        console.error('Error al cargar notificaciones:', notificacionesRes.error);
      }

      if (citasRes.error) {
        console.error('Error al cargar citas recientes:', citasRes.error);
      }

      const citasFormateadas: CitaReciente[] = (citasRes.data || []).map((cita: any) => ({
        id: cita.id,
        paciente_nombre:
          cita.pacientes?.perfiles?.nombre_completo || 'Paciente desconocido',
        doctor_nombre:
          cita.doctores?.perfiles?.nombre_completo || 'Doctor desconocido',
        fecha: cita.fecha,
        hora_inicio: cita.hora_inicio,
        estado: cita.estado,
        motivo: cita.motivo,
      }));

      setStats({
        doctores: doctoresRes.count || 0,
        pacientes: pacientesRes.count || 0,
        citasHoy: citasHoyRes.count || 0,
        citasPendientes: citasPendientesRes.count || 0,
        notificacionesNoLeidas: notificacionesRes.data?.length || 0,
      });

      setCitasRecientes(citasFormateadas);
    } catch (error) {
      console.error('Error general cargando dashboard:', error);
    } finally {
      setCargando(false);
    }
  };

  const getEstadoBadge = (estado: string): React.CSSProperties => {
    const valor = estado.toLowerCase();

    if (valor === 'pendiente') return styles.badgePendiente;
    if (valor === 'confirmado') return styles.badgeConfirmado;
    if (valor === 'cancelada') return styles.badgeCancelada;
    if (valor === 'completada') return styles.badgeCompletada;

    return styles.badgePendiente;
  };

  const getEstadoTexto = (estado: string): string => {
    const textos: Record<string, string> = {
      pendiente: 'Pendiente',
      confirmado: 'Confirmada',
      cancelada: 'Cancelada',
      completada: 'Completada',
    };

    return textos[estado?.toLowerCase()] || estado;
  };

  if (cargando) {
    return (
      <AdminLayout titulo="Dashboard" subtitulo="Cargando estadísticas...">
        <div style={styles.emptyState}>
          <div style={styles.spinner}></div>
          <p>Cargando panel de control...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      titulo="Panel Administrador"
      subtitulo="Sistema de gestión de citas médicas e historial clínico"
    >
      <div style={styles.cardsGrid}>
        <div style={styles.card}>
          <p style={styles.cardTitle}>Doctores</p>
          <h3 style={styles.cardValue}>{stats.doctores}</h3>
          <p style={styles.cardSubtitle}>Profesionales registrados</p>
        </div>

        <div style={styles.card}>
          <p style={styles.cardTitle}>Pacientes</p>
          <h3 style={styles.cardValue}>{stats.pacientes}</h3>
          <p style={styles.cardSubtitle}>Pacientes en el sistema</p>
        </div>

        <div style={styles.card}>
          <p style={styles.cardTitle}>Citas hoy</p>
          <h3 style={styles.cardValue}>{stats.citasHoy}</h3>
          <p style={styles.cardSubtitle}>Para el día de hoy</p>
        </div>

        <div style={styles.card}>
          <p style={styles.cardTitle}>Pendientes</p>
          <h3 style={styles.cardValue}>{stats.citasPendientes}</h3>
          <p style={styles.cardSubtitle}>Citas por confirmar</p>
        </div>

        <div style={styles.card}>
          <p style={styles.cardTitle}>No leídas</p>
          <h3 style={styles.cardValue}>{stats.notificacionesNoLeidas}</h3>
          <p style={styles.cardSubtitle}>Notificaciones pendientes</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div style={styles.tableBox}>
          <div style={styles.tableHeader}>
            <h3 style={styles.tableTitle}>Próximas citas</h3>
            <button style={styles.btnSecondary} onClick={() => navigate('/admin/citas')}>
              Ver todas
            </button>
          </div>

          {citasRecientes.length === 0 ? (
            <div style={styles.emptyState}>
              <p>No hay citas programadas</p>
              <button
                onClick={() => navigate('/admin/citas')}
                style={{ ...styles.btnPrimary, marginTop: '12px' }}
              >
                Crear primera cita
              </button>
            </div>
          ) : (
            <div style={styles.tableResponsive}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Paciente</th>
                    <th style={styles.th}>Doctor</th>
                    <th style={styles.th}>Fecha</th>
                    <th style={styles.th}>Hora</th>
                    <th style={styles.th}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {citasRecientes.map((cita) => (
                    <tr
                      key={cita.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate('/admin/citas')}
                    >
                      <td style={styles.td}>
                        <strong>{cita.paciente_nombre}</strong>
                        {cita.motivo && (
                          <div
                            style={{
                              fontSize: '11px',
                              color: '#94A3B8',
                              marginTop: '4px',
                            }}
                          >
                            {cita.motivo.length > 40
                              ? cita.motivo.substring(0, 40) + '...'
                              : cita.motivo}
                          </div>
                        )}
                      </td>

                      <td style={styles.td}>{cita.doctor_nombre}</td>

                      <td style={styles.td}>
                        {new Date(cita.fecha).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </td>

                      <td style={styles.td}>
                        <span
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            padding: '4px 8px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontFamily: 'monospace',
                          }}
                        >
                          {cita.hora_inicio?.substring(0, 5)}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <span style={getEstadoBadge(cita.estado)}>
                          {getEstadoTexto(cita.estado)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={styles.tableBox}>
          <div style={styles.tableHeader}>
            <h3 style={styles.tableTitle}>Acciones rápidas</h3>
          </div>

          <div
            style={{
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <button style={styles.btnPrimary} onClick={() => navigate('/admin/doctores')}>
              Registrar nuevo doctor
            </button>

            <button
              style={styles.btnSecondary}
              onClick={() => navigate('/admin/especialidades')}
            >
              Crear especialidad
            </button>

            <button style={styles.btnSecondary} onClick={() => navigate('/admin/citas')}>
              Gestionar citas
            </button>

            <button
              style={styles.btnSecondary}
              onClick={() => navigate('/admin/notificaciones')}
            >
              Enviar notificación
            </button>

            <button style={styles.btnSecondary} onClick={() => navigate('/admin/auditoria')}>
              Ver auditoría
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}