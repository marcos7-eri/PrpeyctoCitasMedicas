'use client';

import { useEffect, useState } from 'react';
import { adminStyles as styles } from '@/styles/adminStyles';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';

interface Cita {
  id: string;
  paciente_id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string | null;
  estado: string;
  motivo: string | null;
  paciente_nombre: string;
  paciente_correo: string;
}

interface Paciente {
  id: string;
  nombre_completo: string;
  correo: string;
}

interface Horario {
  id: number;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  activo: boolean;
}

const ESTADO_BADGE: Record<string, React.CSSProperties> = {
  pendiente:  { background: 'rgba(245,158,11,0.15)',  color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)',  padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 },
  confirmada: { background: 'rgba(99,102,241,0.15)',  color: '#818CF8', border: '1px solid rgba(99,102,241,0.3)', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 },
  completada: { background: 'rgba(16,185,129,0.15)',  color: '#10B981', border: '1px solid rgba(16,185,129,0.3)', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 },
  cancelada:  { background: 'rgba(244,63,94,0.15)',   color: '#F43F5E', border: '1px solid rgba(244,63,94,0.3)',  padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 },
};

const ESTADO_TEXTO: Record<string, string> = {
  pendiente: 'Pendiente', confirmada: 'Confirmada', completada: 'Completada', cancelada: 'Cancelada',
};

function sumarMinutos(hora: string, mins: number): string {
  const [h, m] = hora.split(':').map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export default function CitasDoctor() {
  const [cargando,      setCargando]      = useState(true);
  const [citas,         setCitas]         = useState<Cita[]>([]);
  const [pacientes,     setPacientes]     = useState<Paciente[]>([]);
  const [doctorId,      setDoctorId]      = useState<string | null>(null);
  const [procesando,    setProcesando]    = useState<string | null>(null); // id de la cita en proceso

  // Modal nueva cita
  const [mostrarModal,      setMostrarModal]      = useState(false);
  const [guardando,         setGuardando]         = useState(false);
  const [nuevoPacienteId,   setNuevoPacienteId]   = useState('');
  const [nuevaFecha,        setNuevaFecha]        = useState('');
  const [nuevaHoraInicio,   setNuevaHoraInicio]   = useState('');
  const [nuevoMotivo,       setNuevoMotivo]       = useState('');

  // Filtros
  const [busqueda,          setBusqueda]          = useState('');
  const [filtroEstado,      setFiltroEstado]      = useState('todos');

  // Modal cancelar
  const [citaCancelar,      setCitaCancelar]      = useState<Cita | null>(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [cancelando,        setCancelando]        = useState(false);

  useEffect(() => { obtenerDoctorId(); cargarPacientes(); }, []);
  useEffect(() => { if (doctorId) cargarCitas(); }, [doctorId]);

  const obtenerDoctorId = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) { setCargando(false); return; }
      const doctores = await api.get<any[]>(`/doctores?perfil_id=${userData.user.id}`);
      if (doctores && doctores.length > 0) setDoctorId(doctores[0].id);
      else setCargando(false);
    } catch { setCargando(false); }
  };

  const cargarPacientes = async () => {
    try {
      const data = await api.get<any[]>('/pacientes');
      setPacientes((data || []).map((p: any) => ({
        id: p.id,
        nombre_completo: p.perfiles?.nombre_completo || 'Paciente',
        correo: p.perfiles?.correo || '',
      })));
    } catch {}
  };

  const cargarCitas = async () => {
    if (!doctorId) return;
    try {
      setCargando(true);
      const data = await api.get<any[]>(`/citas?doctor_id=${doctorId}`);
      setCitas((data || []).map((c: any) => ({
        id: c.id,
        paciente_id: c.paciente_id,
        fecha: c.fecha,
        hora_inicio: c.hora_inicio,
        hora_fin: c.hora_fin,
        estado: c.estado,
        motivo: c.motivo,
        paciente_nombre: c.pacientes?.perfiles?.nombre_completo || 'Paciente',
        paciente_correo: c.pacientes?.perfiles?.correo || '',
      })));
    } catch {} finally { setCargando(false); }
  };

  const confirmarCita = async (cita: Cita) => {
    if (procesando) return;
    setProcesando(cita.id);
    try {
      await api.patch(`/citas/${cita.id}/confirmar`, {});
      setCitas(prev => prev.map(c => c.id === cita.id ? { ...c, estado: 'confirmada' } : c));
    } catch (e: any) {
      alert(e?.message || 'No se pudo confirmar la cita');
      await cargarCitas();
    } finally { setProcesando(null); }
  };

  const completarCita = async (cita: Cita) => {
    if (procesando) return;
    if (!confirm(`¿Marcar como completada la cita de ${cita.paciente_nombre}?`)) return;
    setProcesando(cita.id);
    try {
      await api.patch(`/citas/${cita.id}/completar`, {});
      setCitas(prev => prev.map(c => c.id === cita.id ? { ...c, estado: 'completada' } : c));
    } catch (e: any) {
      alert(e?.message || 'No se pudo completar la cita');
      await cargarCitas();
    } finally { setProcesando(null); }
  };

  const abrirCancelar = (cita: Cita) => {
    setCitaCancelar(cita);
    setMotivoCancelacion('');
  };

  const ejecutarCancelacion = async () => {
    if (!citaCancelar) return;
    setCancelando(true);
    try {
      await api.patch(`/citas/${citaCancelar.id}/cancelar`, { motivo_cancelacion: motivoCancelacion.trim() || null });
      setCitas(prev => prev.map(c => c.id === citaCancelar.id ? { ...c, estado: 'cancelada' } : c));
      setCitaCancelar(null);
    } catch (e: any) {
      alert(e?.message || 'No se pudo cancelar la cita');
      await cargarCitas();
    } finally { setCancelando(false); }
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setNuevoPacienteId(''); setNuevaFecha(''); setNuevaHoraInicio(''); setNuevoMotivo('');
  };

  const obtenerDiaSemana = (fecha: string) => {
    const [a, m, d] = fecha.split('-').map(Number);
    return new Date(a, m - 1, d).getDay();
  };

  const guardarNuevaCita = async () => {
    if (!doctorId) { alert('No se encontró el doctor autenticado'); return; }
    if (!nuevoPacienteId || !nuevaFecha || !nuevaHoraInicio) { alert('Selecciona paciente, fecha y hora'); return; }
    const dia = obtenerDiaSemana(nuevaFecha);
    if (dia === 0) { alert('No se pueden programar citas los domingos'); return; }
    try {
      setGuardando(true);
      const horarios = await api.get<Horario[]>(`/horarios?doctor_id=${doctorId}&dia_semana=${dia}&activo=true`);
      if (!horarios || horarios.length === 0) { alert('No tienes horarios activos para ese día'); return; }
      const horarioValido = horarios.find(h => {
        const ini = h.hora_inicio.substring(0, 5);
        const fin = h.hora_fin.substring(0, 5);
        return nuevaHoraInicio >= ini && nuevaHoraInicio < fin;
      });
      if (!horarioValido) { alert('La hora seleccionada está fuera de tu horario'); return; }

      const citasDelDia = await api.get<any[]>(`/citas?doctor_id=${doctorId}`);
      const cruce = (citasDelDia || []).filter(c => c.fecha === nuevaFecha && c.estado !== 'cancelada').some(c => {
        const ini = c.hora_inicio.substring(0, 5);
        const fin = c.hora_fin ? c.hora_fin.substring(0, 5) : null;
        return fin ? (nuevaHoraInicio >= ini && nuevaHoraInicio < fin) : nuevaHoraInicio === ini;
      });
      if (cruce) { alert('Ya existe una cita en ese horario'); return; }

      const horaFinTentativa = sumarMinutos(nuevaHoraInicio, 30);
      const horaFinLimite = horarioValido.hora_fin.substring(0, 5);
      const horaFinFinal = horaFinTentativa <= horaFinLimite ? horaFinTentativa : horaFinLimite;

      await api.post('/citas', {
        doctor_id: doctorId, paciente_id: nuevoPacienteId,
        fecha: nuevaFecha, hora_inicio: nuevaHoraInicio,
        hora_fin: horaFinFinal,
        motivo: nuevoMotivo.trim() || null,
      });
      alert('Cita registrada correctamente');
      cerrarModal();
      await cargarCitas();
    } catch (e: any) { alert('Error al crear cita: ' + (e?.message || 'Error')); }
    finally { setGuardando(false); }
  };

  const citasFiltradas = citas.filter(c => {
    const texto = busqueda.toLowerCase();
    const textoOk = texto === '' || c.paciente_nombre.toLowerCase().includes(texto) || (c.motivo?.toLowerCase().includes(texto) ?? false);
    const estadoOk = filtroEstado === 'todos' || c.estado === filtroEstado;
    return textoOk && estadoOk;
  });

  return (
    <>
      <div style={styles.filtersBox}>
        <div style={styles.filtersRow}>
          <input
            type="text"
            placeholder="Buscar por paciente o motivo..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={styles.input}
          />
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={styles.select}>
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="confirmada">Confirmada</option>
            <option value="completada">Completada</option>
            <option value="cancelada">Cancelada</option>
          </select>
          <button style={styles.btnPrimary} onClick={() => setMostrarModal(true)}>+ Nueva cita</button>
        </div>
      </div>

      <div style={styles.tableBox}>
        <div style={styles.tableHeader}>
          <h3 style={styles.tableTitle}>Lista de citas</h3>
          <span style={{ fontSize: '12px', color: '#64748B' }}>{citasFiltradas.length} de {citas.length}</span>
        </div>

        {cargando ? (
          <div style={styles.emptyState}>Cargando citas...</div>
        ) : citasFiltradas.length === 0 ? (
          <div style={styles.emptyState}>
            {citas.length === 0
              ? <><p>No hay citas programadas</p><button style={{ ...styles.btnPrimary, marginTop: '12px' }} onClick={() => setMostrarModal(true)}>Crear primera cita</button></>
              : <p>No hay citas que coincidan con los filtros</p>
            }
          </div>
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
                  <th style={styles.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {citasFiltradas.map(cita => {
                  const enProceso = procesando === cita.id;
                  return (
                    <tr key={cita.id}>
                      <td style={styles.td}>
                        <strong>{cita.paciente_nombre}</strong>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>{cita.paciente_correo}</div>
                      </td>
                      <td style={styles.td}>
                        {new Date(cita.fecha + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </td>
                      <td style={styles.td}>
                        <span style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '8px', fontSize: '12px', fontFamily: 'monospace' }}>
                          {cita.hora_inicio.substring(0, 5)}{cita.hora_fin ? ` — ${cita.hora_fin.substring(0, 5)}` : ''}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {cita.motivo ? (cita.motivo.length > 40 ? cita.motivo.substring(0, 40) + '…' : cita.motivo) : '—'}
                      </td>
                      <td style={styles.td}>
                        <span style={ESTADO_BADGE[cita.estado] ?? ESTADO_BADGE.pendiente}>
                          {ESTADO_TEXTO[cita.estado] ?? cita.estado}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionsRow}>
                          {cita.estado === 'pendiente' && (
                            <button
                              style={{ ...styles.btnEdit, opacity: enProceso ? 0.5 : 1 }}
                              onClick={() => confirmarCita(cita)}
                              disabled={enProceso}
                            >
                              {enProceso ? '...' : 'Confirmar'}
                            </button>
                          )}
                          {(cita.estado === 'pendiente' || cita.estado === 'confirmada') && (
                            <button
                              style={{ ...styles.btnEdit, background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)', opacity: enProceso ? 0.5 : 1 }}
                              onClick={() => completarCita(cita)}
                              disabled={enProceso}
                            >
                              {enProceso ? '...' : 'Completar'}
                            </button>
                          )}
                          {cita.estado !== 'cancelada' && cita.estado !== 'completada' && (
                            <button
                              style={{ ...styles.btnDelete, opacity: enProceso ? 0.5 : 1 }}
                              onClick={() => abrirCancelar(cita)}
                              disabled={enProceso}
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal nueva cita */}
      {mostrarModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>Nueva cita</h2>
            <div style={styles.formGroup}>
              <label style={styles.label}>Paciente</label>
              <select value={nuevoPacienteId} onChange={e => setNuevoPacienteId(e.target.value)} style={styles.select}>
                <option value="">Seleccione un paciente</option>
                {pacientes.map(p => <option key={p.id} value={p.id}>{p.nombre_completo} — {p.correo}</option>)}
              </select>
            </div>
            <div style={styles.rowTwoColumns}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Fecha</label>
                <input type="date" value={nuevaFecha} onChange={e => setNuevaFecha(e.target.value)} style={styles.input} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Hora inicio</label>
                <input type="time" value={nuevaHoraInicio} onChange={e => setNuevaHoraInicio(e.target.value)} style={styles.input} />
              </div>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Motivo</label>
              <textarea
                value={nuevoMotivo}
                onChange={e => setNuevoMotivo(e.target.value)}
                style={{ ...styles.input, minHeight: '80px', resize: 'vertical' } as React.CSSProperties}
                placeholder="Motivo de la cita"
              />
            </div>
            <div style={styles.modalActions}>
              <button style={styles.btnSecondary} onClick={cerrarModal} disabled={guardando}>Cancelar</button>
              <button style={styles.btnPrimary} onClick={guardarNuevaCita} disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar cita'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal cancelar cita */}
      {citaCancelar && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modal, maxWidth: '440px' }}>
            <h2 style={{ ...styles.modalTitle, color: '#F43F5E' }}>Cancelar cita</h2>
            <p style={{ color: '#94A3B8', marginBottom: '16px', fontSize: '14px' }}>
              Vas a cancelar la cita de <strong style={{ color: '#fff' }}>{citaCancelar.paciente_nombre}</strong> del{' '}
              <strong style={{ color: '#fff' }}>{new Date(citaCancelar.fecha + 'T00:00:00').toLocaleDateString('es-ES')}</strong> a las{' '}
              <strong style={{ color: '#fff' }}>{citaCancelar.hora_inicio.substring(0, 5)}</strong>.
            </p>
            <div style={styles.formGroup}>
              <label style={styles.label}>Motivo de cancelación (opcional)</label>
              <textarea
                value={motivoCancelacion}
                onChange={e => setMotivoCancelacion(e.target.value)}
                placeholder="Ej. El doctor no estará disponible ese día"
                style={{ ...styles.input, minHeight: '80px', resize: 'vertical' } as React.CSSProperties}
              />
            </div>
            <div style={styles.modalActions}>
              <button style={styles.btnSecondary} onClick={() => setCitaCancelar(null)} disabled={cancelando}>
                Volver
              </button>
              <button
                style={{ ...styles.btnDelete, padding: '10px 20px', borderRadius: '8px', opacity: cancelando ? 0.6 : 1 }}
                onClick={ejecutarCancelacion}
                disabled={cancelando}
              >
                {cancelando ? 'Cancelando...' : 'Confirmar cancelación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
