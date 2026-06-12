'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminStyles as styles } from '@/styles/adminStyles';
import { api } from '@/lib/api';

interface DoctorItem {
  id: string;
  perfil_id: string;
  especialidad_id: number | null;
  numero_licencia: string | null;
  anios_experiencia: number | null;
  costo_consulta: number | null;
  biografia: string | null;
  perfiles: { id: string; nombre_completo: string; correo: string; telefono?: string | null; estado: 'activo' | 'inactivo' } | null;
  especialidades: { id: number; nombre: string } | null;
}

interface EspecialidadItem { id: number; nombre: string; }

export default function DoctoresAdmin() {
  const [doctores, setDoctores] = useState<DoctorItem[]>([]);
  const [especialidades, setEspecialidades] = useState<EspecialidadItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroEspecialidad, setFiltroEspecialidad] = useState('todas');
  const [doctorEditando, setDoctorEditando] = useState<DoctorItem | null>(null);
  const [formLicencia, setFormLicencia] = useState('');
  const [formExperiencia, setFormExperiencia] = useState('');
  const [formCosto, setFormCosto] = useState('');
  const [formBiografia, setFormBiografia] = useState('');
  const [formEspecialidadId, setFormEspecialidadId] = useState('');
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);
  const [mostrarDetalle, setMostrarDetalle] = useState<DoctorItem | null>(null);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoCorreo, setNuevoCorreo] = useState('');
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [nuevaLicencia, setNuevaLicencia] = useState('');
  const [nuevaExperiencia, setNuevaExperiencia] = useState('');
  const [nuevoCosto, setNuevoCosto] = useState('');
  const [nuevaBiografia, setNuevaBiografia] = useState('');
  const [nuevaEspecialidadId, setNuevaEspecialidadId] = useState('');
  const [guardandoNuevo, setGuardandoNuevo] = useState(false);

  useEffect(() => { cargarDoctores(); cargarEspecialidades(); }, []);

  const cargarDoctores = async () => {
    try {
      setCargando(true); setError('');
      const data = await api.get<DoctorItem[]>('/doctores');
      setDoctores(data || []);
    } catch (e: any) { setError(e.message || 'No se pudieron cargar los doctores'); } finally { setCargando(false); }
  };

  const cargarEspecialidades = async () => {
    try {
      const data = await api.get<EspecialidadItem[]>('/especialidades');
      setEspecialidades(data || []);
    } catch { /* silencioso */ }
  };

  const abrirEdicion = (doctor: DoctorItem) => {
    setDoctorEditando(doctor);
    setFormLicencia(doctor.numero_licencia || '');
    setFormExperiencia(doctor.anios_experiencia ? String(doctor.anios_experiencia) : '');
    setFormCosto(doctor.costo_consulta ? String(doctor.costo_consulta) : '');
    setFormBiografia(doctor.biografia || '');
    setFormEspecialidadId(doctor.especialidad_id ? String(doctor.especialidad_id) : '');
  };

  const cerrarEdicion = () => { setDoctorEditando(null); setFormLicencia(''); setFormExperiencia(''); setFormCosto(''); setFormBiografia(''); setFormEspecialidadId(''); };

  const guardarEdicion = async () => {
    if (!doctorEditando) return;
    try {
      setGuardandoEdicion(true);
      await api.put(`/doctores/${doctorEditando.id}`, {
        numero_licencia: formLicencia,
        anios_experiencia: formExperiencia ? Number(formExperiencia) : null,
        costo_consulta: formCosto ? Number(formCosto) : null,
        biografia: formBiografia,
        especialidad_id: formEspecialidadId ? Number(formEspecialidadId) : null,
      });
      await cargarDoctores(); cerrarEdicion();
    } catch (e: any) { alert('No se pudo actualizar el doctor: ' + e.message); } finally { setGuardandoEdicion(false); }
  };

  const cerrarNuevo = () => {
    setMostrarModalNuevo(false);
    setNuevoNombre(''); setNuevoCorreo(''); setNuevoTelefono(''); setNuevaContrasena('');
    setNuevaLicencia(''); setNuevaExperiencia(''); setNuevoCosto(''); setNuevaBiografia(''); setNuevaEspecialidadId('');
  };

  const guardarNuevoDoctor = async () => {
    if (!nuevoNombre || !nuevoCorreo || !nuevaContrasena) { alert('Completa nombre, correo y contraseña'); return; }
    try {
      setGuardandoNuevo(true);
      await api.post('/doctores', {
        nombre: nuevoNombre,
        correo: nuevoCorreo,
        telefono: nuevoTelefono,
        password: nuevaContrasena,
        especialidad_id: nuevaEspecialidadId || null,
        numero_licencia: nuevaLicencia,
        anios_experiencia: nuevaExperiencia ? Number(nuevaExperiencia) : null,
        costo_consulta: nuevoCosto ? Number(nuevoCosto) : null,
        biografia: nuevaBiografia,
      });
      alert('Doctor creado correctamente'); cerrarNuevo(); await cargarDoctores();
    } catch (e: any) { alert('Error al crear doctor: ' + e.message); } finally { setGuardandoNuevo(false); }
  };

  const doctoresFiltrados = useMemo(() => doctores.filter((doctor) => {
    const nombre = doctor.perfiles?.nombre_completo?.toLowerCase() || '';
    const correo = doctor.perfiles?.correo?.toLowerCase() || '';
    const texto = busqueda.toLowerCase();
    const coincideBusqueda = nombre.includes(texto) || correo.includes(texto) || (doctor.numero_licencia || '').toLowerCase().includes(texto);
    const coincideEspecialidad = filtroEspecialidad === 'todas' ? true : String(doctor.especialidad_id || '') === filtroEspecialidad;
    return coincideBusqueda && coincideEspecialidad;
  }), [doctores, busqueda, filtroEspecialidad]);

  const resumen = useMemo(() => ({
    total: doctores.length,
    activos: doctores.filter((d) => d.perfiles?.estado === 'activo').length,
    inactivos: doctores.filter((d) => d.perfiles?.estado === 'inactivo').length,
    conEspecialidad: doctores.filter((d) => d.especialidades?.nombre).length,
  }), [doctores]);

  return (
    <>
      <div style={styles.cardsGrid}>
        <div style={styles.card}><p style={styles.cardTitle}>Total doctores</p><h3 style={styles.cardValue}>{resumen.total}</h3><p style={styles.cardSubtitle}>Doctores registrados</p></div>
        <div style={styles.card}><p style={styles.cardTitle}>Activos</p><h3 style={styles.cardValue}>{resumen.activos}</h3><p style={styles.cardSubtitle}>Disponibles en el sistema</p></div>
        <div style={styles.card}><p style={styles.cardTitle}>Inactivos</p><h3 style={styles.cardValue}>{resumen.inactivos}</h3><p style={styles.cardSubtitle}>Sin acceso al sistema</p></div>
        <div style={styles.card}><p style={styles.cardTitle}>Con especialidad</p><h3 style={styles.cardValue}>{resumen.conEspecialidad}</h3><p style={styles.cardSubtitle}>Perfil profesional completo</p></div>
      </div>

      <div style={styles.filtersBox}>
        <div style={styles.filtersRow}>
          <input type="text" placeholder="Buscar por nombre, correo o licencia" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={styles.input} />
          <select value={filtroEspecialidad} onChange={(e) => setFiltroEspecialidad(e.target.value)} style={styles.select}>
            <option value="todas">Todas las especialidades</option>
            {especialidades.map((esp) => <option key={esp.id} value={esp.id}>{esp.nombre}</option>)}
          </select>
          <button style={styles.btnSecondary} onClick={cargarDoctores}>Recargar</button>
          <button style={styles.btnPrimary} onClick={() => setMostrarModalNuevo(true)}>+ Nuevo doctor</button>
        </div>
      </div>

      <div style={styles.tableBox}>
        <div style={styles.tableHeader}><h3 style={styles.tableTitle}>Lista de doctores</h3></div>
        {cargando ? <div style={styles.emptyState}>Cargando doctores...</div>
        : error ? <div style={{ ...styles.emptyState, color: '#F87171' }}>{error}</div>
        : doctoresFiltrados.length === 0 ? <div style={styles.emptyState}>No se encontraron doctores</div>
        : (
          <div style={styles.tableResponsive}>
            <table style={styles.table}>
              <thead><tr>
                <th style={styles.th}>Nombre</th><th style={styles.th}>Correo</th><th style={styles.th}>Teléfono</th>
                <th style={styles.th}>Especialidad</th><th style={styles.th}>Licencia</th><th style={styles.th}>Experiencia</th>
                <th style={styles.th}>Consulta</th><th style={styles.th}>Estado</th><th style={styles.th}>Acciones</th>
              </tr></thead>
              <tbody>
                {doctoresFiltrados.map((doctor) => (
                  <tr key={doctor.id}>
                    <td style={styles.td}>{doctor.perfiles?.nombre_completo || 'Sin nombre'}</td>
                    <td style={styles.td}>{doctor.perfiles?.correo || 'Sin correo'}</td>
                    <td style={styles.td}>{doctor.perfiles?.telefono || '—'}</td>
                    <td style={styles.td}>{doctor.especialidades?.nombre || '—'}</td>
                    <td style={styles.td}>{doctor.numero_licencia || '—'}</td>
                    <td style={styles.td}>{doctor.anios_experiencia ? `${doctor.anios_experiencia} años` : '—'}</td>
                    <td style={styles.td}>{doctor.costo_consulta ? `Bs ${doctor.costo_consulta}` : '—'}</td>
                    <td style={styles.td}><span style={doctor.perfiles?.estado === 'activo' ? styles.badgeActive : styles.badgeInactive}>{doctor.perfiles?.estado || 'inactivo'}</span></td>
                    <td style={styles.td}>
                      <div style={styles.actionsRow}>
                        <button style={styles.btnView} onClick={() => setMostrarDetalle(doctor)}>Ver</button>
                        <button style={styles.btnEdit} onClick={() => abrirEdicion(doctor)}>Editar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {doctorEditando && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>Editar doctor</h2>
            <div style={styles.formGroup}>
              <label style={styles.label}>Especialidad</label>
              <select value={formEspecialidadId} onChange={(e) => setFormEspecialidadId(e.target.value)} style={styles.select}>
                <option value="">Seleccione especialidad</option>
                {especialidades.map((esp) => <option key={esp.id} value={esp.id}>{esp.nombre}</option>)}
              </select>
            </div>
            <div style={styles.formGroup}><label style={styles.label}>Número de licencia</label><input type="text" value={formLicencia} onChange={(e) => setFormLicencia(e.target.value)} style={styles.input} /></div>
            <div style={styles.formGroup}><label style={styles.label}>Años de experiencia</label><input type="number" value={formExperiencia} onChange={(e) => setFormExperiencia(e.target.value)} style={styles.input} /></div>
            <div style={styles.formGroup}><label style={styles.label}>Costo de consulta (Bs)</label><input type="number" value={formCosto} onChange={(e) => setFormCosto(e.target.value)} style={styles.input} /></div>
            <div style={styles.formGroup}><label style={styles.label}>Biografía</label><textarea value={formBiografia} onChange={(e) => setFormBiografia(e.target.value)} style={styles.textarea} rows={4} /></div>
            <div style={styles.modalActions}>
              <button style={styles.btnSecondary} onClick={cerrarEdicion}>Cancelar</button>
              <button style={styles.btnPrimary} onClick={guardarEdicion} disabled={guardandoEdicion}>{guardandoEdicion ? 'Guardando...' : 'Guardar cambios'}</button>
            </div>
          </div>
        </div>
      )}

      {mostrarModalNuevo && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>Nuevo doctor</h2>
            <div style={styles.formGroup}><label style={styles.label}>Nombre completo *</label><input type="text" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} style={styles.input} placeholder="Ej: Dr. Juan Pérez" /></div>
            <div style={styles.formGroup}><label style={styles.label}>Correo electrónico *</label><input type="email" value={nuevoCorreo} onChange={(e) => setNuevoCorreo(e.target.value)} style={styles.input} placeholder="doctor@example.com" /></div>
            <div style={styles.formGroup}><label style={styles.label}>Teléfono</label><input type="text" value={nuevoTelefono} onChange={(e) => setNuevoTelefono(e.target.value)} style={styles.input} placeholder="+591 12345678" /></div>
            <div style={styles.formGroup}><label style={styles.label}>Contraseña *</label><input type="password" value={nuevaContrasena} onChange={(e) => setNuevaContrasena(e.target.value)} style={styles.input} placeholder="********" /></div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Especialidad</label>
              <select value={nuevaEspecialidadId} onChange={(e) => setNuevaEspecialidadId(e.target.value)} style={styles.select}>
                <option value="">Seleccione especialidad</option>
                {especialidades.map((esp) => <option key={esp.id} value={esp.id}>{esp.nombre}</option>)}
              </select>
            </div>
            <div style={styles.formGroup}><label style={styles.label}>Número de licencia</label><input type="text" value={nuevaLicencia} onChange={(e) => setNuevaLicencia(e.target.value)} style={styles.input} placeholder="Ej: MED-12345" /></div>
            <div style={styles.formGroup}><label style={styles.label}>Años de experiencia</label><input type="number" value={nuevaExperiencia} onChange={(e) => setNuevaExperiencia(e.target.value)} style={styles.input} placeholder="Ej: 5" /></div>
            <div style={styles.formGroup}><label style={styles.label}>Costo de consulta (Bs)</label><input type="number" value={nuevoCosto} onChange={(e) => setNuevoCosto(e.target.value)} style={styles.input} placeholder="Ej: 250" /></div>
            <div style={styles.formGroup}><label style={styles.label}>Biografía</label><textarea value={nuevaBiografia} onChange={(e) => setNuevaBiografia(e.target.value)} style={styles.textarea} rows={3} placeholder="Información profesional del doctor..." /></div>
            <div style={styles.modalActions}>
              <button style={styles.btnSecondary} onClick={cerrarNuevo}>Cancelar</button>
              <button style={styles.btnPrimary} onClick={guardarNuevoDoctor} disabled={guardandoNuevo}>{guardandoNuevo ? 'Creando...' : 'Crear doctor'}</button>
            </div>
          </div>
        </div>
      )}

      {mostrarDetalle && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>Detalle del doctor</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p><strong>Nombre:</strong> {mostrarDetalle.perfiles?.nombre_completo || 'Sin nombre'}</p>
              <p><strong>Correo:</strong> {mostrarDetalle.perfiles?.correo || 'Sin correo'}</p>
              <p><strong>Teléfono:</strong> {mostrarDetalle.perfiles?.telefono || '—'}</p>
              <p><strong>Estado:</strong> {mostrarDetalle.perfiles?.estado || 'inactivo'}</p>
              <p><strong>Especialidad:</strong> {mostrarDetalle.especialidades?.nombre || '—'}</p>
              <p><strong>Licencia:</strong> {mostrarDetalle.numero_licencia || '—'}</p>
              <p><strong>Experiencia:</strong> {mostrarDetalle.anios_experiencia ? `${mostrarDetalle.anios_experiencia} años` : '—'}</p>
              <p><strong>Costo consulta:</strong> {mostrarDetalle.costo_consulta ? `Bs ${mostrarDetalle.costo_consulta}` : '—'}</p>
              <p><strong>Biografía:</strong> {mostrarDetalle.biografia || '—'}</p>
            </div>
            <div style={styles.modalActions}><button style={styles.btnSecondary} onClick={() => setMostrarDetalle(null)}>Cerrar</button></div>
          </div>
        </div>
      )}
    </>
  );
}
