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

export default function CitasDoctor() {
  const [cargando, setCargando] = useState(true);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [nuevoPacienteId, setNuevoPacienteId] = useState('');
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [nuevaHoraInicio, setNuevaHoraInicio] = useState('');
  const [nuevoMotivo, setNuevoMotivo] = useState('');

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
      setPacientes((data || []).map((p: any) => ({ id: p.id, nombre_completo: p.perfiles?.nombre_completo || 'Paciente', correo: p.perfiles?.correo || '' })));
    } catch (error) { console.error('Error cargando pacientes:', error); }
  };

  const cargarCitas = async () => {
    if (!doctorId) return;
    try {
      setCargando(true);
      const data = await api.get<any[]>(`/citas?doctor_id=${doctorId}`);
      setCitas((data || []).map((cita: any) => ({
        id: cita.id,
        paciente_id: cita.paciente_id,
        fecha: cita.fecha,
        hora_inicio: cita.hora_inicio,
        hora_fin: cita.hora_fin,
        estado: cita.estado,
        motivo: cita.motivo,
        paciente_nombre: cita.pacientes?.perfiles?.nombre_completo || 'Paciente',
        paciente_correo: cita.pacientes?.perfiles?.correo || '',
      })));
    } catch (error) { console.error('Error:', error); } finally { setCargando(false); }
  };

  const cerrarModal = () => { setMostrarModal(false); setNuevoPacienteId(''); setNuevaFecha(''); setNuevaHoraInicio(''); setNuevoMotivo(''); };

  const obtenerDiaSemana = (fecha: string) => {
    const [anio, mes, dia] = fecha.split('-').map(Number);
    return new Date(anio, mes - 1, dia).getDay();
  };

  const guardarNuevaCita = async () => {
    if (!doctorId) { alert('No se encontró el doctor autenticado'); return; }
    if (!nuevoPacienteId || !nuevaFecha || !nuevaHoraInicio) { alert('Selecciona paciente, fecha y hora'); return; }
    const diaSemana = obtenerDiaSemana(nuevaFecha);
    if (diaSemana === 0) { alert('No se pueden programar citas los domingos'); return; }
    try {
      setGuardando(true);
      const horarios = await api.get<Horario[]>(`/horarios?doctor_id=${doctorId}&dia_semana=${diaSemana}&activo=true`);
      if (!horarios || horarios.length === 0) { alert('No tienes horarios activos para ese día'); return; }
      const horarioValido = horarios.find((h) => {
        const inicio = h.hora_inicio.substring(0, 5);
        const fin = h.hora_fin.substring(0, 5);
        return nuevaHoraInicio >= inicio && nuevaHoraInicio < fin;
      });
      if (!horarioValido) { alert('La hora seleccionada está fuera del horario del doctor'); return; }

      const citasDelDia = await api.get<any[]>(`/citas?doctor_id=${doctorId}`);
      const citasMismoDia = (citasDelDia || []).filter((c: any) => c.fecha === nuevaFecha && c.estado !== 'cancelada');
      const existeCruce = citasMismoDia.some((cita: any) => {
        const inicioExistente = cita.hora_inicio.substring(0, 5);
        const finExistente = cita.hora_fin ? cita.hora_fin.substring(0, 5) : null;
        if (!finExistente) return nuevaHoraInicio === inicioExistente;
        return nuevaHoraInicio >= inicioExistente && nuevaHoraInicio < finExistente;
      });
      if (existeCruce) { alert('Ya existe una cita en ese horario'); return; }

      await api.post('/citas', {
        doctor_id: doctorId,
        paciente_id: nuevoPacienteId,
        fecha: nuevaFecha,
        hora_inicio: nuevaHoraInicio,
        hora_fin: horarioValido.hora_fin,
        motivo: nuevoMotivo.trim() || null,
      });
      alert('Cita registrada correctamente');
      cerrarModal();
      await cargarCitas();
    } catch (error: any) { alert('Error al crear cita: ' + (error?.message || 'Error desconocido')); } finally { setGuardando(false); }
  };

  const cambiarEstadoCita = async (id: string, estado: string) => {
    try {
      await api.put(`/citas/${id}`, { estado });
      await cargarCitas();
    } catch (error: any) { alert('No se pudo actualizar la cita: ' + (error?.message || 'Error desconocido')); }
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
    <>
      <div style={styles.tableBox}>
        <div style={styles.tableHeader}>
          <h3 style={styles.tableTitle}>Lista de citas</h3>
          <button style={styles.btnPrimary} onClick={() => setMostrarModal(true)}>Nueva cita</button>
        </div>
        {cargando ? (
          <div style={styles.emptyState}>Cargando citas...</div>
        ) : citas.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No hay citas programadas</p>
            <button style={{ ...styles.btnPrimary, marginTop: '12px' }} onClick={() => setMostrarModal(true)}>Crear primera cita</button>
          </div>
        ) : (
          <div style={styles.tableResponsive}>
            <table style={styles.table}>
              <thead><tr><th style={styles.th}>Paciente</th><th style={styles.th}>Fecha</th><th style={styles.th}>Hora</th><th style={styles.th}>Motivo</th><th style={styles.th}>Estado</th><th style={styles.th}>Acciones</th></tr></thead>
              <tbody>
                {citas.map((cita) => (
                  <tr key={cita.id}>
                    <td style={styles.td}><strong>{cita.paciente_nombre}</strong><div style={{ fontSize: '11px', color: '#94A3B8' }}>{cita.paciente_correo}</div></td>
                    <td style={styles.td}>{new Date(cita.fecha).toLocaleDateString('es-ES')}</td>
                    <td style={styles.td}><span style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '8px', fontSize: '12px', fontFamily: 'monospace' }}>{cita.hora_inicio.substring(0, 5)}{cita.hora_fin ? ` - ${cita.hora_fin.substring(0, 5)}` : ''}</span></td>
                    <td style={styles.td}>{cita.motivo ? (cita.motivo.length > 40 ? cita.motivo.substring(0, 40) + '...' : cita.motivo) : '—'}</td>
                    <td style={styles.td}><span style={getEstadoBadge(cita.estado)}>{getEstadoTexto(cita.estado)}</span></td>
                    <td style={styles.td}>
                      <div style={styles.actionsRow}>
                        {cita.estado === 'pendiente' && <button style={styles.btnEdit} onClick={() => cambiarEstadoCita(cita.id, 'confirmado')}>Confirmar</button>}
                        {cita.estado !== 'completada' && cita.estado !== 'cancelada' && <button style={styles.btnEdit} onClick={() => cambiarEstadoCita(cita.id, 'completada')}>Completar</button>}
                        {cita.estado !== 'cancelada' && cita.estado !== 'completada' && <button style={styles.btnDelete} onClick={() => cambiarEstadoCita(cita.id, 'cancelada')}>Cancelar</button>}
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
            <h2 style={styles.modalTitle}>Nueva cita</h2>
            <div style={styles.formGroup}>
              <label style={styles.label}>Paciente</label>
              <select value={nuevoPacienteId} onChange={(e) => setNuevoPacienteId(e.target.value)} style={styles.select}>
                <option value="">Seleccione un paciente</option>
                {pacientes.map((p) => <option key={p.id} value={p.id}>{p.nombre_completo} - {p.correo}</option>)}
              </select>
            </div>
            <div style={styles.rowTwoColumns}>
              <div style={styles.formGroup}><label style={styles.label}>Fecha</label><input type="date" value={nuevaFecha} onChange={(e) => setNuevaFecha(e.target.value)} style={styles.input} /></div>
              <div style={styles.formGroup}><label style={styles.label}>Hora inicio</label><input type="time" value={nuevaHoraInicio} onChange={(e) => setNuevaHoraInicio(e.target.value)} style={styles.input} /></div>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Motivo</label>
              <textarea value={nuevoMotivo} onChange={(e) => setNuevoMotivo(e.target.value)} style={{ ...styles.input, minHeight: '90px', resize: 'vertical' } as React.CSSProperties} placeholder="Motivo de la cita" />
            </div>
            <div style={styles.modalActions}>
              <button style={styles.btnSecondary} onClick={cerrarModal} disabled={guardando}>Cancelar</button>
              <button style={styles.btnPrimary} onClick={guardarNuevaCita} disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar cita'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
