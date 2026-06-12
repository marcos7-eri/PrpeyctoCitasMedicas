'use client';

import { useEffect, useState } from 'react';
import { adminStyles as styles } from '@/styles/adminStyles';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';

interface Horario {
  id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  activo: boolean;
}

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function HorariosDoctor() {
  const [cargando, setCargando] = useState(true);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevoDia, setNuevoDia] = useState(1);
  const [nuevaHoraInicio, setNuevaHoraInicio] = useState('09:00');
  const [nuevaHoraFin, setNuevaHoraFin] = useState('17:00');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => { obtenerDoctorId(); }, []);
  useEffect(() => { if (doctorId) cargarHorarios(); }, [doctorId]);

  const obtenerDoctorId = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const doctores = await api.get<any[]>(`/doctores?perfil_id=${userData.user.id}`);
        if (doctores && doctores.length > 0) setDoctorId(doctores[0].id);
      }
    } catch (error) { console.error('Error obteniendo doctor ID:', error); }
  };

  const cargarHorarios = async () => {
    if (!doctorId) return;
    try {
      setCargando(true);
      const data = await api.get<Horario[]>(`/horarios?doctor_id=${doctorId}`);
      setHorarios(data || []);
    } catch (error) { console.error('Error cargando horarios:', error); } finally { setCargando(false); }
  };

  const agregarHorario = async () => {
    if (!doctorId) return;
    try {
      setGuardando(true);
      await api.post('/horarios', { doctor_id: doctorId, dia_semana: nuevoDia, hora_inicio: nuevaHoraInicio, hora_fin: nuevaHoraFin, activo: true });
      setMostrarModal(false);
      await cargarHorarios();
    } catch (error: any) { alert('Error al agregar horario: ' + error.message); } finally { setGuardando(false); }
  };

  const toggleHorario = async (horario: Horario) => {
    try {
      await api.put(`/horarios/${horario.id}`, { activo: !horario.activo });
      await cargarHorarios();
    } catch (error: any) { alert('Error actualizando horario: ' + error.message); }
  };

  const eliminarHorario = async (id: string) => {
    if (!confirm('¿Eliminar este horario?')) return;
    try {
      await api.delete(`/horarios/${id}`);
      await cargarHorarios();
    } catch (error: any) { alert('Error eliminando horario: ' + error.message); }
  };

  return (
    <>
      <div style={styles.tableBox}>
        <div style={styles.tableHeader}>
          <h3 style={styles.tableTitle}>Mis horarios</h3>
          <button style={styles.btnPrimary} onClick={() => setMostrarModal(true)}>Agregar horario</button>
        </div>
        {cargando ? (
          <div style={styles.emptyState}>Cargando horarios...</div>
        ) : horarios.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No hay horarios configurados</p>
            <button style={{ ...styles.btnPrimary, marginTop: '12px' }} onClick={() => setMostrarModal(true)}>Configurar horarios</button>
          </div>
        ) : (
          <div style={styles.tableResponsive}>
            <table style={styles.table}>
              <thead><tr><th style={styles.th}>Día</th><th style={styles.th}>Hora inicio</th><th style={styles.th}>Hora fin</th><th style={styles.th}>Estado</th><th style={styles.th}>Acciones</th></tr></thead>
              <tbody>
                {horarios.map((horario) => (
                  <tr key={horario.id}>
                    <td style={styles.td}>{DIAS[horario.dia_semana]}</td>
                    <td style={styles.td}>{horario.hora_inicio.substring(0, 5)}</td>
                    <td style={styles.td}>{horario.hora_fin.substring(0, 5)}</td>
                    <td style={styles.td}><span style={horario.activo ? styles.badgeActive : styles.badgeInactive}>{horario.activo ? 'Activo' : 'Inactivo'}</span></td>
                    <td style={styles.td}>
                      <div style={styles.actionsRow}>
                        <button style={styles.btnEdit} onClick={() => toggleHorario(horario)}>{horario.activo ? 'Desactivar' : 'Activar'}</button>
                        <button style={styles.btnDelete} onClick={() => eliminarHorario(horario.id)}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {mostrarModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>Agregar horario</h2>
            <div style={styles.formGroup}>
              <label style={styles.label}>Día</label>
              <select value={nuevoDia} onChange={(e) => setNuevoDia(Number(e.target.value))} style={styles.select}>
                {DIAS.map((dia, idx) => <option key={idx} value={idx}>{dia}</option>)}
              </select>
            </div>
            <div style={styles.rowTwoColumns}>
              <div style={styles.formGroup}><label style={styles.label}>Hora inicio</label><input type="time" value={nuevaHoraInicio} onChange={(e) => setNuevaHoraInicio(e.target.value)} style={styles.input} /></div>
              <div style={styles.formGroup}><label style={styles.label}>Hora fin</label><input type="time" value={nuevaHoraFin} onChange={(e) => setNuevaHoraFin(e.target.value)} style={styles.input} /></div>
            </div>
            <div style={styles.modalActions}>
              <button style={styles.btnSecondary} onClick={() => setMostrarModal(false)}>Cancelar</button>
              <button style={styles.btnPrimary} onClick={agregarHorario} disabled={guardando}>{guardando ? 'Guardando...' : 'Agregar'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
