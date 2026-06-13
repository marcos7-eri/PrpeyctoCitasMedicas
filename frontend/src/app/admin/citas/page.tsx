'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminStyles as styles } from '@/styles/adminStyles';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';

interface CitaItem {
  id: string;
  paciente_id: string;
  doctor_id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin?: string | null;
  estado: string;
  motivo?: string | null;
  notas?: string | null;
  motivo_cancelacion?: string | null;
  creado_en?: string | null;
  pacientes: { id: string; perfiles: { nombre_completo: string; correo: string; telefono?: string | null } | null } | null;
  doctores: { id: string; perfiles: { nombre_completo: string; correo: string; telefono?: string | null } | null; especialidades?: { nombre: string } | null } | null;
}

interface PacienteOption { id: string; perfiles: { nombre_completo: string; correo: string } | null; }
interface DoctorOption { id: string; perfiles: { nombre_completo: string; correo: string } | null; especialidades?: { nombre: string } | null; }

export default function CitasAdmin() {
  const [citas, setCitas] = useState<CitaItem[]>([]);
  const [pacientes, setPacientes] = useState<PacienteOption[]>([]);
  const [doctores, setDoctores] = useState<DoctorOption[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [procesandoId, setProcesandoId] = useState<string | null>(null);
  const [citaDetalle, setCitaDetalle] = useState<CitaItem | null>(null);
  const [mostrarModalNueva, setMostrarModalNueva] = useState(false);
  const [guardandoNueva, setGuardandoNueva] = useState(false);
  const [nuevoPacienteId, setNuevoPacienteId] = useState('');
  const [nuevoDoctorId, setNuevoDoctorId] = useState('');
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [nuevaHoraInicio, setNuevaHoraInicio] = useState('');
  const [nuevaHoraFin, setNuevaHoraFin] = useState('');
  const [nuevoMotivo, setNuevoMotivo] = useState('');
  const [nuevasNotas, setNuevasNotas] = useState('');

  useEffect(() => { Promise.all([cargarCitas(), cargarPacientes(), cargarDoctores()]); }, []);

  const cargarCitas = async () => {
    try {
      setCargando(true); setError('');
      const data = await api.get<CitaItem[]>('/citas');
      setCitas(data || []);
    } catch (e: any) { setError(e.message || 'No se pudieron cargar las citas'); } finally { setCargando(false); }
  };

  const cargarPacientes = async () => {
    try {
      const data = await api.get<PacienteOption[]>('/pacientes');
      setPacientes(data || []);
    } catch { /* silencioso */ }
  };

  const cargarDoctores = async () => {
    try {
      const data = await api.get<DoctorOption[]>('/doctores');
      setDoctores(data || []);
    } catch { /* silencioso */ }
  };

  const cerrarModalNueva = () => {
    setMostrarModalNueva(false);
    setNuevoPacienteId(''); setNuevoDoctorId(''); setNuevaFecha('');
    setNuevaHoraInicio(''); setNuevaHoraFin(''); setNuevoMotivo(''); setNuevasNotas('');
  };

  const crearCita = async () => {
    if (!nuevoPacienteId || !nuevoDoctorId || !nuevaFecha || !nuevaHoraInicio) { alert('Completa paciente, doctor, fecha y hora de inicio'); return; }
    try {
      setGuardandoNueva(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const creadorId = sessionData.session?.user?.id || null;
      await api.post('/citas', {
        paciente_id: nuevoPacienteId,
        doctor_id: nuevoDoctorId,
        fecha: nuevaFecha,
        hora_inicio: nuevaHoraInicio,
        hora_fin: nuevaHoraFin || null,
        motivo: nuevoMotivo || null,
        notas: nuevasNotas || null,
        creado_por: creadorId,
      });
      alert('Cita creada correctamente'); cerrarModalNueva(); await cargarCitas();
    } catch (e: any) { alert('No se pudo crear la cita: ' + e.message); } finally { setGuardandoNueva(false); }
  };

  const cambiarEstado = async (cita: CitaItem, nuevoEstado: string) => {
    try {
      setProcesandoId(cita.id);
      await api.put(`/citas/${cita.id}`, { estado: nuevoEstado });
      await cargarCitas();
      if (citaDetalle && citaDetalle.id === cita.id) setCitaDetalle({ ...citaDetalle, estado: nuevoEstado });
    } catch (e: any) { alert('No se pudo actualizar la cita: ' + e.message); } finally { setProcesandoId(null); }
  };

  const cancelarCita = async (cita: CitaItem) => {
    const motivo = window.prompt('Escribe el motivo de cancelación');
    if (motivo === null) return;
    try {
      setProcesandoId(cita.id);
      await api.put(`/citas/${cita.id}`, { estado: 'cancelada', motivo_cancelacion: motivo || null });
      await cargarCitas();
      if (citaDetalle && citaDetalle.id === cita.id) setCitaDetalle({ ...citaDetalle, estado: 'cancelada', motivo_cancelacion: motivo || null });
    } catch (e: any) { alert('No se pudo cancelar la cita: ' + e.message); } finally { setProcesandoId(null); }
  };

  const citasFiltradas = useMemo(() => {
    const texto = busqueda.toLowerCase();
    return citas.filter((cita) => {
      const paciente = cita.pacientes?.perfiles?.nombre_completo?.toLowerCase() || '';
      const doctor = cita.doctores?.perfiles?.nombre_completo?.toLowerCase() || '';
      const motivo = cita.motivo?.toLowerCase() || '';
      const coincideBusqueda = paciente.includes(texto) || doctor.includes(texto) || motivo.includes(texto);
      const coincideEstado = filtroEstado === 'todos' ? true : cita.estado === filtroEstado;
      return coincideBusqueda && coincideEstado;
    });
  }, [citas, busqueda, filtroEstado]);

  const resumen = useMemo(() => ({
    total: citas.length,
    pendientes: citas.filter((c) => c.estado === 'pendiente').length,
    confirmados: citas.filter((c) => c.estado === 'confirmada').length,
    canceladas: citas.filter((c) => c.estado === 'cancelada').length,
  }), [citas]);

  const getEstadoBadge = (estado: string): React.CSSProperties => {
    if (estado === 'pendiente') return styles.badgePendiente;
    if (estado === 'confirmada') return styles.badgeConfirmado;
    if (estado === 'cancelada') return styles.badgeCancelada;
    if (estado === 'completada') return styles.badgeCompletada;
    return styles.badgePendiente;
  };

  const getEstadoTexto = (estado: string): string => {
    const map: Record<string, string> = { pendiente: 'PENDIENTE', confirmada: 'CONFIRMADA', cancelada: 'CANCELADA', completada: 'COMPLETADA' };
    return map[estado] || estado.toUpperCase();
  };

  return (
    <>
      <div style={styles.cardsGrid}>
        <div style={styles.card}><p style={styles.cardTitle}>Total citas</p><h3 style={styles.cardValue}>{resumen.total}</h3><p style={styles.cardSubtitle}>Citas registradas</p></div>
        <div style={styles.card}><p style={styles.cardTitle}>Pendientes</p><h3 style={styles.cardValue}>{resumen.pendientes}</h3><p style={styles.cardSubtitle}>Por confirmar</p></div>
        <div style={styles.card}><p style={styles.cardTitle}>Confirmadas</p><h3 style={styles.cardValue}>{resumen.confirmados}</h3><p style={styles.cardSubtitle}>Citas activas</p></div>
        <div style={styles.card}><p style={styles.cardTitle}>Canceladas</p><h3 style={styles.cardValue}>{resumen.canceladas}</h3><p style={styles.cardSubtitle}>No vigentes</p></div>
      </div>

      <div style={styles.filtersBox}>
        <div style={styles.filtersRow}>
          <input type="text" placeholder="Buscar por paciente, doctor o motivo..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={styles.input} />
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} style={styles.select}>
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendiente</option><option value="confirmada">Confirmada</option>
            <option value="cancelada">Cancelada</option><option value="completada">Completada</option>
          </select>
          <button style={styles.btnSecondary} onClick={cargarCitas}>Recargar</button>
          <button style={styles.btnPrimary} onClick={() => setMostrarModalNueva(true)}>+ Nueva cita</button>
        </div>
      </div>

      <div style={styles.tableBox}>
        <div style={styles.tableHeader}><h3 style={styles.tableTitle}>Lista de citas</h3></div>
        {cargando ? <div style={styles.emptyState}>Cargando citas...</div>
        : error ? <div style={{ ...styles.emptyState, color: '#F87171' }}>{error}</div>
        : citasFiltradas.length === 0 ? <div style={styles.emptyState}>No se encontraron citas</div>
        : (
          <div style={styles.tableResponsive}>
            <table style={styles.table}>
              <thead><tr><th style={styles.th}>Paciente</th><th style={styles.th}>Doctor</th><th style={styles.th}>Fecha</th><th style={styles.th}>Hora</th><th style={styles.th}>Motivo</th><th style={styles.th}>Estado</th><th style={styles.th}>Acciones</th></tr></thead>
              <tbody>
                {citasFiltradas.map((cita) => (
                  <tr key={cita.id}>
                    <td style={styles.td}>
                      <div><div style={{ fontWeight: 500 }}>{cita.pacientes?.perfiles?.nombre_completo || '—'}</div><div style={{ fontSize: '11px', color: '#94A3B8' }}>{cita.pacientes?.perfiles?.correo || ''}</div></div>
                    </td>
                    <td style={styles.td}>
                      <div><div style={{ fontWeight: 500 }}>{cita.doctores?.perfiles?.nombre_completo || '—'}</div><div style={{ fontSize: '11px', color: '#94A3B8' }}>{cita.doctores?.especialidades?.nombre || ''}</div></div>
                    </td>
                    <td style={styles.td}><div style={{ fontSize: '13px' }}>{new Date(cita.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</div></td>
                    <td style={styles.td}><span style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '8px', fontSize: '12px', fontFamily: 'monospace' }}>{cita.hora_inicio.substring(0, 5)}{cita.hora_fin ? ` - ${cita.hora_fin.substring(0, 5)}` : ''}</span></td>
                    <td style={styles.td}><div style={{ maxWidth: '180px', whiteSpace: 'normal' }}>{cita.motivo || '—'}</div></td>
                    <td style={styles.td}><span style={getEstadoBadge(cita.estado)}>{getEstadoTexto(cita.estado)}</span></td>
                    <td style={styles.td}>
                      <div style={styles.actionsRow}>
                        <button style={styles.btnView} onClick={() => setCitaDetalle(cita)}>Ver</button>
                        {cita.estado === 'pendiente' && <button style={styles.btnEdit} onClick={() => cambiarEstado(cita, 'confirmada')} disabled={procesandoId === cita.id}>Confirmar</button>}
                        {cita.estado === 'confirmada' && <button style={styles.btnPrimary} onClick={() => cambiarEstado(cita, 'completada')} disabled={procesandoId === cita.id}>Completar</button>}
                        {(cita.estado === 'pendiente' || cita.estado === 'confirmada') && <button style={styles.btnDelete} onClick={() => cancelarCita(cita)} disabled={procesandoId === cita.id}>Cancelar</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {mostrarModalNueva && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>Nueva cita médica</h2>
            <div style={styles.formGroup}>
              <label style={styles.label}>Paciente *</label>
              <select value={nuevoPacienteId} onChange={(e) => setNuevoPacienteId(e.target.value)} style={styles.select}>
                <option value="">Seleccione un paciente</option>
                {pacientes.map((p) => <option key={p.id} value={p.id}>{p.perfiles?.nombre_completo || 'Sin nombre'} - {p.perfiles?.correo || ''}</option>)}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Doctor *</label>
              <select value={nuevoDoctorId} onChange={(e) => setNuevoDoctorId(e.target.value)} style={styles.select}>
                <option value="">Seleccione un doctor</option>
                {doctores.map((d) => <option key={d.id} value={d.id}>{d.perfiles?.nombre_completo || 'Sin nombre'}{d.especialidades?.nombre ? ` (${d.especialidades.nombre})` : ''}</option>)}
              </select>
            </div>
            <div style={styles.formGroup}><label style={styles.label}>Fecha *</label><input type="date" value={nuevaFecha} onChange={(e) => setNuevaFecha(e.target.value)} style={styles.input} /></div>
            <div style={styles.rowTwoColumns}>
              <div style={styles.formGroup}><label style={styles.label}>Hora inicio *</label><input type="time" value={nuevaHoraInicio} onChange={(e) => setNuevaHoraInicio(e.target.value)} style={styles.input} /></div>
              <div style={styles.formGroup}><label style={styles.label}>Hora fin</label><input type="time" value={nuevaHoraFin} onChange={(e) => setNuevaHoraFin(e.target.value)} style={styles.input} /></div>
            </div>
            <div style={styles.formGroup}><label style={styles.label}>Motivo de la consulta</label><input type="text" value={nuevoMotivo} onChange={(e) => setNuevoMotivo(e.target.value)} style={styles.input} placeholder="Ej: Dolor de cabeza, revisión anual..." /></div>
            <div style={styles.formGroup}><label style={styles.label}>Notas adicionales</label><textarea value={nuevasNotas} onChange={(e) => setNuevasNotas(e.target.value)} style={styles.textarea} rows={3} /></div>
            <div style={styles.modalActions}>
              <button style={styles.btnSecondary} onClick={cerrarModalNueva}>Cancelar</button>
              <button style={styles.btnPrimary} onClick={crearCita} disabled={guardandoNueva}>{guardandoNueva ? 'Creando...' : 'Crear cita'}</button>
            </div>
          </div>
        </div>
      )}

      {citaDetalle && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalLarge}>
            <h2 style={styles.modalTitle}>Detalle de la cita</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ background: 'rgba(49,151,149,0.05)', padding: '16px', borderRadius: '16px', borderLeft: '3px solid #319795' }}>
                <h3 style={{ fontSize: '14px', color: '#319795', margin: '0 0 12px 0' }}>Paciente</h3>
                <p style={{ margin: '8px 0' }}><strong>Nombre:</strong> {citaDetalle.pacientes?.perfiles?.nombre_completo || '—'}</p>
                <p style={{ margin: '8px 0' }}><strong>Correo:</strong> {citaDetalle.pacientes?.perfiles?.correo || '—'}</p>
                <p style={{ margin: '8px 0' }}><strong>Teléfono:</strong> {citaDetalle.pacientes?.perfiles?.telefono || '—'}</p>
              </div>
              <div style={{ background: 'rgba(59,130,246,0.05)', padding: '16px', borderRadius: '16px', borderLeft: '3px solid #3B82F6' }}>
                <h3 style={{ fontSize: '14px', color: '#3B82F6', margin: '0 0 12px 0' }}>Doctor</h3>
                <p style={{ margin: '8px 0' }}><strong>Nombre:</strong> {citaDetalle.doctores?.perfiles?.nombre_completo || '—'}</p>
                <p style={{ margin: '8px 0' }}><strong>Correo:</strong> {citaDetalle.doctores?.perfiles?.correo || '—'}</p>
                <p style={{ margin: '8px 0' }}><strong>Especialidad:</strong> {citaDetalle.doctores?.especialidades?.nombre || '—'}</p>
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '16px', marginTop: '16px' }}>
              <h3 style={{ fontSize: '14px', color: '#94A3B8', margin: '0 0 12px 0' }}>Detalles de la cita</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <p><strong>Fecha:</strong> {new Date(citaDetalle.fecha).toLocaleDateString('es-ES')}</p>
                <p><strong>Hora inicio:</strong> {citaDetalle.hora_inicio.substring(0, 5)}</p>
                {citaDetalle.hora_fin && <p><strong>Hora fin:</strong> {citaDetalle.hora_fin.substring(0, 5)}</p>}
                <p><strong>Estado:</strong> <span style={getEstadoBadge(citaDetalle.estado)}>{getEstadoTexto(citaDetalle.estado)}</span></p>
                <p><strong>Motivo:</strong> {citaDetalle.motivo || '—'}</p>
                <p><strong>Notas:</strong> {citaDetalle.notas || '—'}</p>
                {citaDetalle.motivo_cancelacion && <p><strong>Motivo cancelación:</strong> {citaDetalle.motivo_cancelacion}</p>}
              </div>
            </div>
            <div style={styles.modalActions}><button style={styles.btnSecondary} onClick={() => setCitaDetalle(null)}>Cerrar</button></div>
          </div>
        </div>
      )}
    </>
  );
}
