'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { adminStyles as styles } from '@/styles/adminStyles';
import { supabase } from '@/lib/supabase';

interface Cita {
  id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string | null;
  estado: string;
  motivo: string | null;
  doctor_nombre: string;
  especialidad: string;
}

export default function CitasPaciente() {
  const { usuario } = useAuth();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { if (usuario) cargarCitas(); }, [usuario]);

  const cargarCitas = async () => {
    try {
      setCargando(true); setError('');
      const { data: paciente, error: errorPaciente } = await supabase.from('pacientes').select('id, perfil_id').eq('perfil_id', usuario?.id).single();
      if (errorPaciente || !paciente) { setError('No se encontró el paciente asociado'); return; }
      const { data: dataCitas, error: errorCitas } = await supabase
        .from('citas')
        .select(`
          id, fecha, hora_inicio, hora_fin, estado, motivo,
          doctores(
            perfiles(nombre_completo),
            especialidades(nombre)
          )
        `)
        .eq('paciente_id', paciente.id)
        .order('fecha', { ascending: false });
      if (errorCitas) { setError(errorCitas.message); return; }
      setCitas((dataCitas || []).map((c: any) => ({
        id: c.id,
        fecha: c.fecha,
        hora_inicio: c.hora_inicio,
        hora_fin: c.hora_fin,
        estado: c.estado,
        motivo: c.motivo,
        doctor_nombre: c.doctores?.perfiles?.nombre_completo || 'Doctor',
        especialidad: c.doctores?.especialidades?.nombre || '—',
      })));
    } catch { setError('Error al cargar citas'); } finally { setCargando(false); }
  };

  const getEstadoBadge = (estado: string): React.CSSProperties => {
    if (estado === 'pendiente') return styles.badgePendiente;
    if (estado === 'confirmado') return styles.badgeConfirmado;
    if (estado === 'cancelada') return styles.badgeCancelada;
    if (estado === 'completada') return styles.badgeCompletada;
    return styles.badgePendiente;
  };

  const getEstadoTexto = (estado: string) => ({ pendiente: 'Pendiente', confirmado: 'Confirmada', cancelada: 'Cancelada', completada: 'Completada' }[estado] || estado);

  return (
    <div style={styles.tableBox}>
      <div style={styles.tableHeader}>
        <h3 style={styles.tableTitle}>Mis citas</h3>
        <button style={styles.btnSecondary} onClick={cargarCitas}>Recargar</button>
      </div>
      {cargando ? (
        <div style={styles.emptyState}>Cargando citas...</div>
      ) : error ? (
        <div style={{ ...styles.emptyState, color: '#F87171' }}>{error}</div>
      ) : citas.length === 0 ? (
        <div style={styles.emptyState}>No tienes ninguna cita registrada</div>
      ) : (
        <div style={styles.tableResponsive}>
          <table style={styles.table}>
            <thead><tr><th style={styles.th}>Doctor</th><th style={styles.th}>Especialidad</th><th style={styles.th}>Fecha</th><th style={styles.th}>Hora</th><th style={styles.th}>Motivo</th><th style={styles.th}>Estado</th></tr></thead>
            <tbody>
              {citas.map((cita) => (
                <tr key={cita.id}>
                  <td style={styles.td}><strong>{cita.doctor_nombre}</strong></td>
                  <td style={styles.td}>{cita.especialidad}</td>
                  <td style={styles.td}>{new Date(cita.fecha).toLocaleDateString('es-ES')}</td>
                  <td style={styles.td}><span style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '8px', fontSize: '12px', fontFamily: 'monospace' }}>{cita.hora_inicio.substring(0, 5)}{cita.hora_fin ? ` - ${cita.hora_fin.substring(0, 5)}` : ''}</span></td>
                  <td style={styles.td}>{cita.motivo ? (cita.motivo.length > 40 ? cita.motivo.substring(0, 40) + '...' : cita.motivo) : '—'}</td>
                  <td style={styles.td}><span style={getEstadoBadge(cita.estado)}>{getEstadoTexto(cita.estado)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
