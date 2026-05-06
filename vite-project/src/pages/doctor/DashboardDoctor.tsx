import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DoctorLayout from './DoctorLayout';
import { adminStyles as styles } from '../Admin/admin';
import { supabase } from '../../lib/supabase';


interface CitaProxima {
  id: string;
  paciente_nombre: string;
  fecha: string;
  hora_inicio: string;
  estado: string;
  motivo: string | null;
}

export default function DashboardDoctor() {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(true);
  const [stats, setStats] = useState({
    citasHoy: 0,
    citasPendientes: 0,
    totalPacientes: 0,
    notificacionesNoLeidas: 0,
  });
  const [citasProximas, setCitasProximas] = useState<CitaProxima[]>([]);
  const [doctorId, setDoctorId] = useState<string | null>(null);

  useEffect(() => {
    obtenerDoctorId();
  }, []);

  useEffect(() => {
    if (doctorId) {
      cargarDashboard();
    }
  }, [doctorId]);

  const obtenerDoctorId = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const { data: doctorData } = await supabase
          .from('doctores')
          .select('id')
          .eq('perfil_id', userData.user.id)
          .single();
        
        if (doctorData) {
          setDoctorId(doctorData.id);
        }
      }
    } catch (error) {
      console.error('Error obteniendo doctor ID:', error);
    }
  };

  const cargarDashboard = async () => {
    if (!doctorId) return;

    try {
      setCargando(true);

      const hoy = new Date().toISOString().split('T')[0];

      const [
        citasHoyRes,
        citasPendientesRes,
        pacientesRes,
        notificacionesRes,
        citasProximasRes,
      ] = await Promise.all([
        supabase
          .from('citas')
          .select('*', { count: 'exact', head: true })
          .eq('doctor_id', doctorId)
          .eq('fecha', hoy),
        supabase
          .from('citas')
          .select('*', { count: 'exact', head: true })
          .eq('doctor_id', doctorId)
          .eq('estado', 'pendiente'),
        supabase
          .from('citas')
          .select('paciente_id', { count: 'exact', head: false })
          .eq('doctor_id', doctorId)
          .select('paciente_id'),
        supabase
          .from('notificaciones')
          .select('id', { count: 'exact', head: false })
          .eq('leido', false),
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
            )
          `)
          .eq('doctor_id', doctorId)
          .gte('fecha', hoy)
          .order('fecha', { ascending: true })
          .order('hora_inicio', { ascending: true })
          .limit(5),
      ]);

      const pacientesUnicos = new Set();
      if (pacientesRes.data) {
        pacientesRes.data.forEach((cita: any) => {
          if (cita.paciente_id) pacientesUnicos.add(cita.paciente_id);
        });
      }

      const citasFormateadas = (citasProximasRes.data || []).map((cita: any) => ({
        id: cita.id,
        paciente_nombre: cita.pacientes?.perfiles?.nombre_completo || 'Paciente',
        fecha: cita.fecha,
        hora_inicio: cita.hora_inicio,
        estado: cita.estado,
        motivo: cita.motivo,
      }));

      setStats({
        citasHoy: citasHoyRes.count || 0,
        citasPendientes: citasPendientesRes.count || 0,
        totalPacientes: pacientesUnicos.size,
        notificacionesNoLeidas: notificacionesRes.count || 0,
      });
      setCitasProximas(citasFormateadas);
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setCargando(false);
    }
  };

  const getEstadoBadge = (estado: string): React.CSSProperties => {
    if (estado === 'pendiente') return styles.badgePendiente;
    if (estado === 'confirmado') return styles.badgeConfirmado;
    if (estado === 'cancelada') return styles.badgeCancelada;
    if (estado === 'completada') return styles.badgeCompletada;
    return styles.badgePendiente;
  };

  const getEstadoTexto = (estado: string): string => {
    const textos: Record<string, string> = {
      pendiente: 'Pendiente',
      confirmado: 'Confirmada',
      cancelada: 'Cancelada',
      completada: 'Completada',
    };
    return textos[estado] || estado;
  };

  if (cargando) {
    return (
      <DoctorLayout titulo="Dashboard" subtitulo="Cargando estadisticas...">
        <div style={styles.emptyState}>
          <div style={styles.spinner}></div>
          <p>Cargando panel de control...</p>
        </div>
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout
      titulo="Panel del Doctor"
      subtitulo="Gestion de agenda, pacientes e historial medico"
    >
      <div style={styles.cardsGrid}>
        <div style={styles.card}>
          <p style={styles.cardTitle}>Citas de hoy</p>
          <h3 style={styles.cardValue}>{stats.citasHoy}</h3>
          <p style={styles.cardSubtitle}>{stats.citasPendientes} pendientes</p>
        </div>

        <div style={styles.card}>
          <p style={styles.cardTitle}>Pacientes atendidos</p>
          <h3 style={styles.cardValue}>{stats.totalPacientes}</h3>
          <p style={styles.cardSubtitle}>Total de pacientes</p>
        </div>

        <div style={styles.card}>
          <p style={styles.cardTitle}>Horarios activos</p>
          <h3 style={styles.cardValue}>0</h3>
          <p style={styles.cardSubtitle}>Configurar horarios</p>
        </div>

        <div style={styles.card}>
          <p style={styles.cardTitle}>Notificaciones</p>
          <h3 style={styles.cardValue}>{stats.notificacionesNoLeidas}</h3>
          <p style={styles.cardSubtitle}>Sin leer</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div style={styles.tableBox}>
          <div style={styles.tableHeader}>
            <h3 style={styles.tableTitle}>Proximas citas</h3>
            <button style={styles.btnSecondary} onClick={() => navigate('/doctor/citas')}>
              Ver todas
            </button>
          </div>

          {citasProximas.length === 0 ? (
            <div style={styles.emptyState}>
              <p>No hay citas programadas</p>
              <button 
                onClick={() => navigate('/doctor/citas')}
                style={{ ...styles.btnPrimary, marginTop: '12px' }}
              >
                Crear cita
              </button>
            </div>
          ) : (
            <div style={styles.tableResponsive}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Paciente</th>
                    <th style={styles.th}>Fecha</th>
                    <th style={styles.th}>Hora</th>
                    <th style={styles.th}>Estado</th>
                    <th style={styles.th}>Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {citasProximas.map((cita) => (
                    <tr key={cita.id} style={{ cursor: 'pointer' }} onClick={() => navigate('/doctor/citas')}>
                      <td style={styles.td}>
                        <strong>{cita.paciente_nombre}</strong>
                      </td>
                      <td style={styles.td}>
                        {new Date(cita.fecha).toLocaleDateString('es-ES')}
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          background: 'rgba(255,255,255,0.05)',
                          padding: '4px 8px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontFamily: 'monospace'
                        }}>
                          {cita.hora_inicio.substring(0, 5)}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={getEstadoBadge(cita.estado)}>
                          {getEstadoTexto(cita.estado)}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {cita.motivo ? (cita.motivo.length > 30 ? cita.motivo.substring(0, 30) + '...' : cita.motivo) : '—'}
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
            <h3 style={styles.tableTitle}>Acciones rapidas</h3>
          </div>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button style={styles.btnPrimary} onClick={() => navigate('/doctor/citas')}>
              Nueva cita
            </button>
            <button style={styles.btnSecondary} onClick={() => navigate('/doctor/horarios')}>
              Agregar horario
            </button>
            <button style={styles.btnSecondary} onClick={() => navigate('/doctor/historial')}>
              Ver historial
            </button>
            <button style={styles.btnSecondary} onClick={() => navigate('/doctor/notificaciones')}>
              Ver notificaciones
            </button>
          </div>

          <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#FFFFFF', margin: '0 0 16px 0' }}>
              Resumen del dia
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
              <div>
                <p style={{ fontSize: '28px', fontWeight: '700', color: '#319795', margin: 0 }}>
                  {stats.citasHoy}
                </p>
                <p style={{ fontSize: '12px', color: '#94A3B8', margin: '4px 0 0' }}>Citas</p>
              </div>
              <div>
                <p style={{ fontSize: '28px', fontWeight: '700', color: '#319795', margin: 0 }}>0</p>
                <p style={{ fontSize: '12px', color: '#94A3B8', margin: '4px 0 0' }}>Atendidos</p>
              </div>
              <div>
                <p style={{ fontSize: '28px', fontWeight: '700', color: '#319795', margin: 0 }}>
                  {stats.citasPendientes}
                </p>
                <p style={{ fontSize: '12px', color: '#94A3B8', margin: '4px 0 0' }}>Pendientes</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DoctorLayout>
  );
}