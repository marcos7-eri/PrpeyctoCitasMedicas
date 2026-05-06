import { useEffect, useState } from 'react';
import DoctorLayout from './DoctorLayout';
import { adminStyles as styles } from '../Admin/admin';
import { supabase } from '../../lib/supabase';

interface HistorialCita {
  id: string;
  fecha: string;
  hora_inicio: string;
  motivo: string | null;
  estado: string;
  paciente_nombre: string;
}

export default function HistorialDoctor() {
  const [cargando, setCargando] = useState(true);
  const [historial, setHistorial] = useState<HistorialCita[]>([]);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    obtenerDoctorId();
  }, []);

  useEffect(() => {
    if (doctorId) {
      cargarHistorial();
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

  const cargarHistorial = async () => {
    if (!doctorId) return;

    try {
      setCargando(true);

      const { data, error } = await supabase
        .from('citas')
        .select(`
          id,
          fecha,
          hora_inicio,
          motivo,
          estado,
          pacientes (
            perfiles (
              nombre_completo
            )
          )
        `)
        .eq('doctor_id', doctorId)
        .in('estado', ['completada', 'cancelada'])
        .order('fecha', { ascending: false });

      if (error) throw error;

      const historialFormateado = (data || []).map((cita: any) => ({
        id: cita.id,
        fecha: cita.fecha,
        hora_inicio: cita.hora_inicio,
        motivo: cita.motivo,
        estado: cita.estado,
        paciente_nombre: cita.pacientes?.perfiles?.nombre_completo || 'Paciente',
      }));

      setHistorial(historialFormateado);
    } catch (error) {
      console.error('Error cargando historial:', error);
    } finally {
      setCargando(false);
    }
  };

  const historialFiltrado = historial.filter(h =>
    h.paciente_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (h.motivo && h.motivo.toLowerCase().includes(busqueda.toLowerCase()))
  );

  const getEstadoBadge = (estado: string): React.CSSProperties => {
    if (estado === 'completada') return styles.badgeConfirmado;
    if (estado === 'cancelada') return styles.badgeCancelada;
    return styles.badgePendiente;
  };

  return (
    <DoctorLayout titulo="Historial Medico" subtitulo="Historial clinico de pacientes">
      <div style={styles.filtersBox}>
        <div style={styles.filtersRow}>
          <input
            type="text"
            placeholder="Buscar por paciente o motivo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={styles.input}
          />
          <button style={styles.btnSecondary} onClick={cargarHistorial}>Recargar</button>
        </div>
      </div>

      <div style={styles.tableBox}>
        <div style={styles.tableHeader}>
          <h3 style={styles.tableTitle}>Historial clinico</h3>
        </div>

        {cargando ? (
          <div style={styles.emptyState}>Cargando historial...</div>
        ) : historialFiltrado.length === 0 ? (
          <div style={styles.emptyState}>No hay registros de historial</div>
        ) : (
          <div style={styles.tableResponsive}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Paciente</th>
                  <th style={styles.th}>Fecha</th>
                  <th style={styles.th}>Hora</th>
                  <th style={styles.th}>Motivo</th>
                  <th style={styles.th}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {historialFiltrado.map((item) => (
                  <tr key={item.id}>
                    <td style={styles.td}>
                      <strong>{item.paciente_nombre}</strong>
                    </td>
                    <td style={styles.td}>
                      {new Date(item.fecha).toLocaleDateString('es-ES')}
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        background: 'rgba(255,255,255,0.05)',
                        padding: '4px 8px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontFamily: 'monospace'
                      }}>
                        {item.hora_inicio.substring(0, 5)}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {item.motivo ? (item.motivo.length > 50 ? item.motivo.substring(0, 50) + '...' : item.motivo) : '—'}
                    </td>
                    <td style={styles.td}>
                      <span style={getEstadoBadge(item.estado)}>
                        {item.estado === 'completada' ? 'Completada' : 'Cancelada'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DoctorLayout>
  );
}