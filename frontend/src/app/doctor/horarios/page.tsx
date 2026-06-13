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
  const [errorModal, setErrorModal] = useState('');

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

  const horaAMin = (h: string) => { const [hh, mm] = h.split(':').map(Number); return hh * 60 + mm; };

  const agregarHorario = async () => {
    if (!doctorId) return;
    setErrorModal('');

    const ini = horaAMin(nuevaHoraInicio);
    const fin = horaAMin(nuevaHoraFin);

    if (fin <= ini) {
      setErrorModal('La hora de fin debe ser mayor que la hora de inicio.');
      return;
    }
    if (fin - ini < 30) {
      setErrorModal('El bloque debe durar al menos 30 minutos.');
      return;
    }

    const solapamiento = horarios
      .filter(h => h.dia_semana === nuevoDia)
      .some(h => {
        const hIni = horaAMin(h.hora_inicio);
        const hFin = horaAMin(h.hora_fin);
        return ini < hFin && fin > hIni;
      });
    if (solapamiento) {
      setErrorModal('Este bloque se solapa con un horario ya existente para ese día.');
      return;
    }

    try {
      setGuardando(true);
      await api.post('/horarios', { doctor_id: doctorId, dia_semana: nuevoDia, hora_inicio: nuevaHoraInicio, hora_fin: nuevaHoraFin, activo: true });
      setMostrarModal(false);
      setErrorModal('');
      await cargarHorarios();
    } catch (error: any) { setErrorModal('Error al agregar horario: ' + error.message); } finally { setGuardando(false); }
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
      {/* Banner de ayuda */}
      <div style={{
        background: 'rgba(49,151,149,0.08)',
        border: '1px solid rgba(49,151,149,0.25)',
        borderRadius: '16px',
        padding: '14px 20px',
        display: 'flex',
        gap: '14px',
        alignItems: 'flex-start',
      }}>
        <div style={{ color: '#2DD4BF', fontSize: '18px', fontWeight: '700', flexShrink: 0, lineHeight: 1.4 }}>ⓘ</div>
        <div>
          <div style={{ color: '#2DD4BF', fontSize: '13px', fontWeight: '700', marginBottom: '5px' }}>
            ¿Tienes almuerzo u otras pausas?
          </div>
          <div style={{ color: '#94A3B8', fontSize: '13px', lineHeight: '1.65' }}>
            Crea <strong style={{ color: '#CBD5E1' }}>dos bloques separados</strong> para el mismo día.
            Ejemplo:{' '}
            <span style={{ fontFamily: 'monospace', color: '#CBD5E1', background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: '4px' }}>08:00 – 12:00</span>
            {' '}y{' '}
            <span style={{ fontFamily: 'monospace', color: '#CBD5E1', background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: '4px' }}>14:00 – 18:00</span>.
            Los pacientes solo podrán reservar dentro de esos bloques.
          </div>
        </div>
      </div>

      {/* Botón agregar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button style={styles.btnPrimary} onClick={() => setMostrarModal(true)}>+ Agregar horario</button>
      </div>

      {/* Contenido */}
      {cargando ? (
        <div style={styles.emptyState}>Cargando horarios...</div>
      ) : horarios.length === 0 ? (
        <div style={styles.emptyState}>
          <p>No hay horarios configurados</p>
          <button style={{ ...styles.btnPrimary, marginTop: '12px' }} onClick={() => setMostrarModal(true)}>Configurar horarios</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3, 4, 5, 6, 0].map(dia => {
            const bloques = horarios
              .filter(h => h.dia_semana === dia)
              .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
            if (bloques.length === 0) return null;
            return (
              <div key={dia} style={styles.tableBox}>
                <div style={styles.tableHeader}>
                  <h3 style={styles.tableTitle}>{DIAS[dia]}</h3>
                  <span style={{ fontSize: '12px', color: bloques.length > 1 ? '#2DD4BF' : '#64748B' }}>
                    {bloques.length} bloque{bloques.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div style={styles.tableResponsive}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Inicio</th>
                        <th style={styles.th}>Fin</th>
                        <th style={styles.th}>Estado</th>
                        <th style={styles.th}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bloques.map(horario => (
                        <tr key={horario.id}>
                          <td style={styles.td}>
                            <span style={{ fontFamily: 'monospace', fontSize: '14px', color: '#E2E8F0' }}>
                              {horario.hora_inicio.substring(0, 5)}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <span style={{ fontFamily: 'monospace', fontSize: '14px', color: '#E2E8F0' }}>
                              {horario.hora_fin.substring(0, 5)}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <span style={horario.activo ? styles.badgeActive : styles.badgeInactive}>
                              {horario.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <div style={styles.actionsRow}>
                              <button style={styles.btnEdit} onClick={() => toggleHorario(horario)}>
                                {horario.activo ? 'Desactivar' : 'Activar'}
                              </button>
                              <button style={styles.btnDelete} onClick={() => eliminarHorario(horario.id)}>
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {mostrarModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>Agregar horario</h2>

            <div style={styles.formGroup}>
              <label style={styles.label}>Día</label>
              <select
                value={nuevoDia}
                onChange={e => { setNuevoDia(Number(e.target.value)); setErrorModal(''); }}
                style={styles.select}
              >
                {DIAS.map((dia, idx) => <option key={idx} value={idx}>{dia}</option>)}
              </select>
              {nuevoDia === 0 && (
                <div style={{ marginTop: '6px', fontSize: '12px', color: '#F59E0B', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '8px', padding: '6px 10px' }}>
                  Los domingos no se permiten reservas de citas en el sistema.
                </div>
              )}
            </div>

            <div style={styles.rowTwoColumns}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Hora inicio</label>
                <input
                  type="time"
                  value={nuevaHoraInicio}
                  onChange={e => { setNuevaHoraInicio(e.target.value); setErrorModal(''); }}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Hora fin</label>
                <input
                  type="time"
                  value={nuevaHoraFin}
                  onChange={e => { setNuevaHoraFin(e.target.value); setErrorModal(''); }}
                  style={styles.input}
                />
              </div>
            </div>

            {nuevaHoraInicio && nuevaHoraFin && horaAMin(nuevaHoraFin) > horaAMin(nuevaHoraInicio) && (
              <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '8px' }}>
                Duración:{' '}
                <strong style={{ color: '#CBD5E1' }}>
                  {horaAMin(nuevaHoraFin) - horaAMin(nuevaHoraInicio)} min
                  {' '}({Math.floor((horaAMin(nuevaHoraFin) - horaAMin(nuevaHoraInicio)) / 30)} slot{Math.floor((horaAMin(nuevaHoraFin) - horaAMin(nuevaHoraInicio)) / 30) !== 1 ? 's' : ''} de 30 min)
                </strong>
              </div>
            )}

            {errorModal && (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#FCA5A5', marginBottom: '4px' }}>
                {errorModal}
              </div>
            )}

            <div style={styles.modalActions}>
              <button style={styles.btnSecondary} onClick={() => { setMostrarModal(false); setErrorModal(''); }}>Cancelar</button>
              <button style={styles.btnPrimary} onClick={agregarHorario} disabled={guardando}>
                {guardando ? 'Guardando...' : 'Agregar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
