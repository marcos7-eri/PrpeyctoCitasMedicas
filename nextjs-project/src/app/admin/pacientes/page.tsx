'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminStyles as styles } from '@/styles/adminStyles';
import { supabase } from '@/lib/supabase';

interface PacienteItem {
  id: string;
  perfil_id: string;
  fecha_nacimiento?: string | null;
  genero?: string | null;
  direccion?: string | null;
  tipo_sangre?: string | null;
  contacto_emergencia_nombre?: string | null;
  contacto_emergencia_telefono?: string | null;
  perfiles: { id: string; nombre_completo: string; correo: string; telefono?: string | null; estado: 'activo' | 'inactivo'; creado_en?: string } | null;
}

interface CitaResumen { id: string; fecha: string; hora_inicio: string; estado: string; motivo?: string | null; }

export default function PacientesAdmin() {
  const [pacientes, setPacientes] = useState<PacienteItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [procesandoId, setProcesandoId] = useState<string | null>(null);
  const [pacienteEditando, setPacienteEditando] = useState<PacienteItem | null>(null);
  const [formNombre, setFormNombre] = useState('');
  const [formTelefono, setFormTelefono] = useState('');
  const [formEstado, setFormEstado] = useState<'activo' | 'inactivo'>('activo');
  const [formFechaNacimiento, setFormFechaNacimiento] = useState('');
  const [formGenero, setFormGenero] = useState('');
  const [formDireccion, setFormDireccion] = useState('');
  const [formTipoSangre, setFormTipoSangre] = useState('');
  const [formContactoNombre, setFormContactoNombre] = useState('');
  const [formContactoTelefono, setFormContactoTelefono] = useState('');
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [pacienteDetalle, setPacienteDetalle] = useState<PacienteItem | null>(null);
  const [citasDetalle, setCitasDetalle] = useState<CitaResumen[]>([]);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  useEffect(() => { cargarPacientes(); }, []);

  const cargarPacientes = async () => {
    try {
      setCargando(true); setError('');
      const { data, error } = await supabase.from('pacientes').select(`id, perfil_id, fecha_nacimiento, genero, direccion, tipo_sangre, contacto_emergencia_nombre, contacto_emergencia_telefono, perfiles(id, nombre_completo, correo, telefono, estado, creado_en)`);
      if (error) { setError(error.message); return; }
      setPacientes((data as unknown as PacienteItem[]) || []);
    } catch { setError('No se pudieron cargar los pacientes'); } finally { setCargando(false); }
  };

  const pacientesFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase();
    return pacientes.filter((p) => {
      const nombre = p.perfiles?.nombre_completo?.toLowerCase() || '';
      const correo = p.perfiles?.correo?.toLowerCase() || '';
      const telefono = p.perfiles?.telefono?.toLowerCase() || '';
      return nombre.includes(texto) || correo.includes(texto) || telefono.includes(texto);
    });
  }, [pacientes, busqueda]);

  const resumen = useMemo(() => ({
    total: pacientes.length,
    activos: pacientes.filter((p) => p.perfiles?.estado === 'activo').length,
    inactivos: pacientes.filter((p) => p.perfiles?.estado === 'inactivo').length,
    conTipoSangre: pacientes.filter((p) => p.tipo_sangre && p.tipo_sangre.trim() !== '').length,
  }), [pacientes]);

  const cambiarEstadoPaciente = async (paciente: PacienteItem) => {
    if (!paciente.perfiles?.id) return;
    const nuevoEstado = paciente.perfiles.estado === 'activo' ? 'inactivo' : 'activo';
    try {
      setProcesandoId(paciente.id);
      const { error } = await supabase.from('perfiles').update({ estado: nuevoEstado }).eq('id', paciente.perfiles.id);
      if (error) { alert('No se pudo actualizar el estado: ' + error.message); return; }
      await cargarPacientes();
    } catch { alert('Ocurrió un error al cambiar el estado'); } finally { setProcesandoId(null); }
  };

  const abrirEdicion = (paciente: PacienteItem) => {
    setPacienteEditando(paciente);
    setFormNombre(paciente.perfiles?.nombre_completo || '');
    setFormTelefono(paciente.perfiles?.telefono || '');
    setFormEstado(paciente.perfiles?.estado || 'activo');
    setFormFechaNacimiento(paciente.fecha_nacimiento || '');
    setFormGenero(paciente.genero || '');
    setFormDireccion(paciente.direccion || '');
    setFormTipoSangre(paciente.tipo_sangre || '');
    setFormContactoNombre(paciente.contacto_emergencia_nombre || '');
    setFormContactoTelefono(paciente.contacto_emergencia_telefono || '');
  };

  const cerrarEdicion = () => { setPacienteEditando(null); };

  const guardarEdicion = async () => {
    if (!pacienteEditando || !pacienteEditando.perfiles?.id) return;
    try {
      setGuardandoEdicion(true);
      const { error: errorPerfil } = await supabase.from('perfiles').update({ nombre_completo: formNombre, telefono: formTelefono, estado: formEstado }).eq('id', pacienteEditando.perfiles.id);
      if (errorPerfil) { alert('No se pudo actualizar el perfil: ' + errorPerfil.message); return; }
      const { error: errorPaciente } = await supabase.from('pacientes').update({ fecha_nacimiento: formFechaNacimiento || null, genero: formGenero || null, direccion: formDireccion || null, tipo_sangre: formTipoSangre || null, contacto_emergencia_nombre: formContactoNombre || null, contacto_emergencia_telefono: formContactoTelefono || null }).eq('id', pacienteEditando.id);
      if (errorPaciente) { alert('No se pudo actualizar el paciente: ' + errorPaciente.message); return; }
      alert('Paciente actualizado correctamente'); cerrarEdicion(); await cargarPacientes();
    } catch { alert('Ocurrió un error al guardar'); } finally { setGuardandoEdicion(false); }
  };

  const verDetalle = async (paciente: PacienteItem) => {
    setPacienteDetalle(paciente); setCitasDetalle([]); setCargandoDetalle(true);
    try {
      const { data, error } = await supabase.from('citas').select('id, fecha, hora_inicio, estado, motivo').eq('paciente_id', paciente.id).order('fecha', { ascending: false });
      if (error) { alert('No se pudieron cargar las citas: ' + error.message); return; }
      setCitasDetalle((data as CitaResumen[]) || []);
    } catch { alert('Ocurrió un error al cargar detalle'); } finally { setCargandoDetalle(false); }
  };

  const getTipoSangreColor = (tipo: string): string => {
    const colores: Record<string, string> = { 'A+': '#4ADE80', 'A-': '#22C55E', 'B+': '#60A5FA', 'B-': '#3B82F6', 'AB+': '#A78BFA', 'AB-': '#8B5CF6', 'O+': '#FBBF24', 'O-': '#F59E0B' };
    return colores[tipo] || '#94A3B8';
  };

  return (
    <>
      <div style={styles.cardsGrid}>
        <div style={styles.card}><p style={styles.cardTitle}>Total pacientes</p><h3 style={styles.cardValue}>{resumen.total}</h3><p style={styles.cardSubtitle}>Pacientes registrados</p></div>
        <div style={styles.card}><p style={styles.cardTitle}>Activos</p><h3 style={styles.cardValue}>{resumen.activos}</h3><p style={styles.cardSubtitle}>Con acceso al sistema</p></div>
        <div style={styles.card}><p style={styles.cardTitle}>Inactivos</p><h3 style={styles.cardValue}>{resumen.inactivos}</h3><p style={styles.cardSubtitle}>Sin acceso al sistema</p></div>
        <div style={styles.card}><p style={styles.cardTitle}>Con tipo de sangre</p><h3 style={styles.cardValue}>{resumen.conTipoSangre}</h3><p style={styles.cardSubtitle}>Ficha más completa</p></div>
      </div>

      <div style={styles.filtersBox}>
        <div style={styles.filtersRow}>
          <input type="text" placeholder="Buscar por nombre, correo o teléfono..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={styles.input} />
          <button style={styles.btnSecondary} onClick={cargarPacientes}>Recargar</button>
        </div>
      </div>

      <div style={styles.tableBox}>
        <div style={styles.tableHeader}><h3 style={styles.tableTitle}>Lista de pacientes</h3></div>
        {cargando ? <div style={styles.emptyState}>Cargando pacientes...</div>
        : error ? <div style={{ ...styles.emptyState, color: '#F87171' }}>{error}</div>
        : pacientesFiltrados.length === 0 ? <div style={styles.emptyState}>No se encontraron pacientes</div>
        : (
          <div style={styles.tableResponsive}>
            <table style={styles.table}>
              <thead><tr><th style={styles.th}>Paciente</th><th style={styles.th}>Contacto</th><th style={styles.th}>Tipo sangre</th><th style={styles.th}>Estado</th><th style={styles.th}>Registro</th><th style={styles.th}>Acciones</th></tr></thead>
              <tbody>
                {pacientesFiltrados.map((paciente) => (
                  <tr key={paciente.id}>
                    <td style={styles.td}>
                      <div>
                        <div style={{ fontWeight: 600, color: '#FFFFFF' }}>{paciente.perfiles?.nombre_completo || 'Sin nombre'}</div>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>ID: {paciente.id.substring(0, 8)}...</div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div>
                        <div style={{ fontSize: '13px' }}>{paciente.perfiles?.correo || '—'}</div>
                        <div style={{ fontSize: '12px', color: '#94A3B8' }}>📞 {paciente.perfiles?.telefono || '—'}</div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      {paciente.tipo_sangre ? (
                        <span style={{ display: 'inline-block', padding: '6px 12px', background: `${getTipoSangreColor(paciente.tipo_sangre)}20`, borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', color: getTipoSangreColor(paciente.tipo_sangre), border: `1px solid ${getTipoSangreColor(paciente.tipo_sangre)}40` }}>
                          {paciente.tipo_sangre}
                        </span>
                      ) : <span style={{ color: '#64748B' }}>—</span>}
                    </td>
                    <td style={styles.td}><span style={paciente.perfiles?.estado === 'activo' ? styles.badgeActive : styles.badgeInactive}>{paciente.perfiles?.estado === 'activo' ? 'Activo' : 'Inactivo'}</span></td>
                    <td style={styles.td}><div style={{ fontSize: '12px' }}>{paciente.perfiles?.creado_en ? new Date(paciente.perfiles.creado_en).toLocaleDateString('es-ES') : '—'}</div></td>
                    <td style={styles.td}>
                      <div style={styles.actionsRow}>
                        <button style={styles.btnView} onClick={() => verDetalle(paciente)}>Ver</button>
                        <button style={styles.btnEdit} onClick={() => abrirEdicion(paciente)}>Editar</button>
                        <button style={paciente.perfiles?.estado === 'activo' ? styles.btnDelete : styles.btnEdit} onClick={() => cambiarEstadoPaciente(paciente)} disabled={procesandoId === paciente.id}>
                          {paciente.perfiles?.estado === 'activo' ? 'Inactivar' : 'Activar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pacienteEditando && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>Editar paciente</h2>
            <div style={styles.formGroup}><label style={styles.label}>Nombre completo</label><input value={formNombre} onChange={(e) => setFormNombre(e.target.value)} style={styles.input} /></div>
            <div style={styles.formGroup}><label style={styles.label}>Teléfono</label><input value={formTelefono} onChange={(e) => setFormTelefono(e.target.value)} style={styles.input} /></div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Estado</label>
              <select value={formEstado} onChange={(e) => setFormEstado(e.target.value as 'activo' | 'inactivo')} style={styles.select}>
                <option value="activo">Activo</option><option value="inactivo">Inactivo</option>
              </select>
            </div>
            <div style={styles.rowTwoColumns}>
              <div style={styles.formGroup}><label style={styles.label}>Fecha de nacimiento</label><input type="date" value={formFechaNacimiento} onChange={(e) => setFormFechaNacimiento(e.target.value)} style={styles.input} /></div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Género</label>
                <select value={formGenero} onChange={(e) => setFormGenero(e.target.value)} style={styles.select}>
                  <option value="">Seleccionar</option><option value="Masculino">Masculino</option><option value="Femenino">Femenino</option><option value="Otro">Otro</option>
                </select>
              </div>
            </div>
            <div style={styles.formGroup}><label style={styles.label}>Dirección</label><input value={formDireccion} onChange={(e) => setFormDireccion(e.target.value)} style={styles.input} /></div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Tipo de sangre</label>
              <select value={formTipoSangre} onChange={(e) => setFormTipoSangre(e.target.value)} style={styles.select}>
                <option value="">Seleccionar</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={styles.rowTwoColumns}>
              <div style={styles.formGroup}><label style={styles.label}>Contacto emergencia</label><input value={formContactoNombre} onChange={(e) => setFormContactoNombre(e.target.value)} style={styles.input} /></div>
              <div style={styles.formGroup}><label style={styles.label}>Teléfono emergencia</label><input value={formContactoTelefono} onChange={(e) => setFormContactoTelefono(e.target.value)} style={styles.input} /></div>
            </div>
            <div style={styles.modalActions}>
              <button style={styles.btnSecondary} onClick={cerrarEdicion}>Cancelar</button>
              <button style={styles.btnPrimary} onClick={guardarEdicion} disabled={guardandoEdicion}>{guardandoEdicion ? 'Guardando...' : 'Guardar cambios'}</button>
            </div>
          </div>
        </div>
      )}

      {pacienteDetalle && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalLarge}>
            <h2 style={styles.modalTitle}>Detalle del paciente</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ background: 'rgba(49,151,149,0.05)', padding: '20px', borderRadius: '16px', borderLeft: '3px solid #319795' }}>
                <h3 style={{ fontSize: '16px', color: '#319795', margin: '0 0 16px 0' }}>Información personal</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <p><strong>Nombre:</strong> {pacienteDetalle.perfiles?.nombre_completo || '—'}</p>
                  <p><strong>Correo:</strong> {pacienteDetalle.perfiles?.correo || '—'}</p>
                  <p><strong>Teléfono:</strong> {pacienteDetalle.perfiles?.telefono || '—'}</p>
                  <p><strong>Fecha nac.:</strong> {pacienteDetalle.fecha_nacimiento || '—'}</p>
                  <p><strong>Género:</strong> {pacienteDetalle.genero || '—'}</p>
                  <p><strong>Tipo sangre:</strong> {pacienteDetalle.tipo_sangre || '—'}</p>
                  <p><strong>Dirección:</strong> {pacienteDetalle.direccion || '—'}</p>
                </div>
              </div>
              <div style={{ background: 'rgba(239,68,68,0.05)', padding: '20px', borderRadius: '16px', borderLeft: '3px solid #F87171' }}>
                <h3 style={{ fontSize: '16px', color: '#F87171', margin: '0 0 16px 0' }}>Contacto de emergencia</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <p><strong>Nombre:</strong> {pacienteDetalle.contacto_emergencia_nombre || '—'}</p>
                  <p><strong>Teléfono:</strong> {pacienteDetalle.contacto_emergencia_telefono || '—'}</p>
                </div>
              </div>
            </div>
            <div style={{ marginTop: '20px', background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '16px' }}>
              <h3 style={{ fontSize: '16px', color: '#FFFFFF', margin: '0 0 16px 0' }}>Historial de citas</h3>
              {cargandoDetalle ? <div style={styles.emptyState}>Cargando citas...</div>
              : citasDetalle.length === 0 ? <div style={{ textAlign: 'center', color: '#64748B', padding: '20px' }}>No tiene citas registradas</div>
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p><strong>Total citas:</strong> {citasDetalle.length}</p>
                  {citasDetalle.slice(0, 8).map((cita) => (
                    <div key={cita.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div><div style={{ fontWeight: 600 }}>{cita.fecha}</div><div style={{ fontSize: '12px', color: '#94A3B8' }}>{cita.hora_inicio}</div></div>
                      <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: cita.estado === 'confirmado' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)', color: cita.estado === 'confirmado' ? '#4ADE80' : '#FBBF24' }}>{cita.estado}</span>
                      <div style={{ fontSize: '13px', color: '#CBD5E1', maxWidth: '200px' }}>{cita.motivo || 'Sin motivo'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={styles.modalActions}><button style={styles.btnSecondary} onClick={() => setPacienteDetalle(null)}>Cerrar</button></div>
          </div>
        </div>
      )}
    </>
  );
}
